import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { makeMcpServer } from "./mcp-server";
import { StreamProcessor } from "./stream-processor";
import { CHAT_SYSTEM_PROMPT } from "./system-prompt";
import { supabase } from "@/lib/supabase";
import type { ClaimData } from "@/lib/types";
import type { ChatSSEEvent } from "@/lib/sse-types";
import type { ClaimState } from "./tools";

interface RunChatOptions {
  sessionId: string;
  message: string;
  userId: string;
  abortController?: AbortController;
  onEvent: (event: ChatSSEEvent) => void;
}

async function* streamPrompt(content: string): AsyncIterable<SDKUserMessage> {
  yield {
    type: "user",
    message: { role: "user", content },
    parent_tool_use_id: null,
    session_id: "",
  };
}

export async function runChat({ sessionId, message, userId, abortController, onEvent }: RunChatOptions) {
  // Load session (user_id filter doubles as ownership check)
  const { data: session, error: loadErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (loadErr || !session) {
    onEvent({ type: "error", message: "Session not found or unauthorized" });
    return;
  }

  const currentClaim = session.claim as ClaimData | null;

  // Persist user message and mark session as processing in parallel
  await Promise.all([
    supabase.from("messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    }),
    supabase.from("sessions").update({ status: "processing" }).eq("id", sessionId),
  ]);

  // Mutable claim state
  const claimState: ClaimState = {
    claim: currentClaim,
    highlights: [],
    suggestedPrompts: [],
    onClaimUpdate: (claim: ClaimData) => {
      claimState.claim = claim;
      onEvent({ type: "claim_updated", claim });
      if (claim.riskScore !== currentClaim?.riskScore) {
        onEvent({ type: "risk_score_updated", score: claim.riskScore });
      }
    },
    onHighlightsUpdate: () => {
      // Highlights are only relevant during initial analysis, no-op in chat
    },
    onToolResult: (tool, result) => {
      onEvent({ type: "tool_result", tool, result });
    },
  };

  const mcpServer = makeMcpServer(claimState);

  const claimContext = currentClaim
    ? `\n\nCurrent claim state:\n${JSON.stringify(currentClaim, null, 2)}`
    : "\n\nNo claim has been built yet.";

  const fullPrompt = `The user says: "${message}"${claimContext}\n\nClinical notes:\n${session.clinical_notes}`;

  const processor = new StreamProcessor({
    onText: (text) => onEvent({ type: "agent_text", text }),
    onToolStart: (toolName) => {
      onEvent({ type: "tool_call", tool: toolName, query: "" });
    },
    onToolInput: (toolName, extracted) => {
      onEvent({ type: "tool_call", tool: toolName, query: extracted });
    },
    onAssistantToolUse: (toolName, input) => {
      if (toolName === "update_claim" && input.action === "resolve_finding") {
        onEvent({
          type: "finding_resolved",
          findingId: input.finding_id as string,
          reason: (input.resolved_reason as string) || "",
        });
      }
      if (toolName === "update_claim" && input.action === "add_finding" && input.finding) {
        onEvent({
          type: "finding_added",
          finding: input.finding as ClaimData["findings"][0],
        });
      }
    },
    onError: (message) => onEvent({ type: "error", message }),
  });

  try {
    const response = query({
      prompt: streamPrompt(fullPrompt),
      options: {
        abortController,
        systemPrompt: CHAT_SYSTEM_PROMPT,
        model: "claude-opus-4-6",
        mcpServers: { billing: mcpServer },
        tools: ["WebSearch"],
        allowedTools: ["mcp__billing__*", "WebSearch"],
        includePartialMessages: true,
        maxTurns: 100,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    });

    for await (const msg of response) {
      if (processor.process(msg)) break;
    }
  } catch (err) {
    // Client disconnected — exit silently
    if (abortController?.signal.aborted) return;

    await supabase.from("sessions").update({ status: "error", updated_at: new Date().toISOString() }).eq("id", sessionId);
    onEvent({ type: "error", message: `Agent error: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }

  const finalClaim = claimState.claim;
  const suggestedPrompts = claimState.suggestedPrompts.length >= 2
    ? claimState.suggestedPrompts
    : extractSuggestedPrompts(processor.accumulatedText);

  // Persist to Supabase BEFORE emitting completion — a follow-up chat
  // message could arrive immediately and read stale claim data otherwise.
  await Promise.all([
    supabase
      .from("sessions")
      .update({
        claim: finalClaim,
        agent_session_id: processor.agentSessionId,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId),
    supabase.from("messages").insert({
      session_id: sessionId,
      role: "agent",
      content: processor.accumulatedText,
      suggested_prompts: suggestedPrompts,
    }),
  ]).catch((err) => console.error("Failed to persist chat results:", err));

  onEvent({
    type: "chat_complete",
    summary: processor.accumulatedText,
    suggestedPrompts,
  });
}

function extractSuggestedPrompts(text: string): string[] {
  const defaults = ["Check for other issues", "Export the claim"];
  const lines = text.split("\n").filter(Boolean);
  const prompts: string[] = [];
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 6); i--) {
    const line = lines[i].trim();
    const match = line.match(/^[-•*]\s*[""]?(.+?)[""]?\s*$/);
    if (match && match[1].length > 3 && match[1].length < 80) {
      prompts.unshift(match[1]);
    }
  }
  return prompts.length >= 2 ? prompts.slice(0, 4) : defaults;
}
