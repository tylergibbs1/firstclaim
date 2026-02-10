import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { makeMcpServer } from "./mcp-server";
import { CHAT_SYSTEM_PROMPT } from "./system-prompt";
import { supabase } from "@/lib/supabase";
import type { ClaimData } from "@/lib/types";
import type { ChatSSEEvent } from "@/lib/sse-types";
import type { ClaimState } from "./tools";

// Hoisted regex patterns — avoid re-creation on every streaming chunk
const RE_QUERY = /"query"\s*:\s*"([^"]*)/;
const RE_CODE = /"code"\s*:\s*"([^"]*)/;
const RE_ACTION = /"action"\s*:\s*"([^"]*)/;

interface RunChatOptions {
  sessionId: string;
  message: string;
  userId: string;
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

export async function runChat({ sessionId, message, userId, onEvent }: RunChatOptions) {
  // Load session
  const { data: session, error: loadErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (loadErr || !session) {
    onEvent({ type: "error", message: `Session not found: ${loadErr?.message}` });
    return;
  }

  // Verify session belongs to this user
  if (session.user_id !== userId) {
    onEvent({ type: "error", message: "Unauthorized" });
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

  let accumulatedText = "";
  let agentSessionId: string | undefined = session.agent_session_id;
  let inTool = false;
  let toolInputBuffer = "";
  let currentToolName = "";

  try {
    const response = query({
      prompt: streamPrompt(fullPrompt),
      options: {
        systemPrompt: CHAT_SYSTEM_PROMPT,
        model: "claude-opus-4-6",
        mcpServers: { billing: mcpServer },
        allowedTools: ["mcp__billing__*", "WebSearch"],
        includePartialMessages: true,
        maxTurns: 10,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        ...(agentSessionId ? { resume: agentSessionId } : {}),
      },
    });

    for await (const msg of response) {
      if (msg.type === "system" && msg.subtype === "init") {
        agentSessionId = msg.session_id;
      }

      // Stream text and tool-call deltas in real-time
      if (msg.type === "stream_event") {
        const event = msg.event;

        if (event.type === "content_block_start") {
          const block = (event as Record<string, unknown>).content_block as Record<string, unknown> | undefined;
          if (block?.type === "tool_use") {
            inTool = true;
            currentToolName = (block.name as string || "").replace("mcp__billing__", "");
            toolInputBuffer = "";
            onEvent({ type: "tool_call", tool: currentToolName, query: "" });
          }
        }

        if (event.type === "content_block_delta") {
          const delta = (event as Record<string, unknown>).delta as Record<string, unknown> | undefined;
          if (delta?.type === "text_delta" && !inTool) {
            const text = delta.text as string;
            accumulatedText += text;
            onEvent({ type: "agent_text", text });
          }
          if (delta?.type === "input_json_delta" && inTool) {
            toolInputBuffer += (delta.partial_json as string) || "";
            const queryMatch = toolInputBuffer.match(RE_QUERY);
            const codeMatch = toolInputBuffer.match(RE_CODE);
            const actionMatch = toolInputBuffer.match(RE_ACTION);
            const extracted = queryMatch?.[1] || codeMatch?.[1] || actionMatch?.[1];
            if (extracted) {
              onEvent({ type: "tool_call", tool: currentToolName, query: extracted });
            }
          }
        }

        if (event.type === "content_block_stop") {
          inTool = false;
          currentToolName = "";
          toolInputBuffer = "";
        }
      }

      // Complete assistant messages — detect tool mutations
      if (msg.type === "assistant" && msg.message?.content) {
        for (const block of msg.message.content) {
          if ("name" in block && block.type === "tool_use") {
            const toolName = block.name.replace("mcp__billing__", "");
            const input = block.input as Record<string, unknown>;

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
          }
        }
      }

      // Fallback: accumulate text from complete assistant messages
      if (msg.type === "assistant" && msg.message?.content) {
        for (const block of msg.message.content) {
          if ("text" in block && block.type === "text") {
            if (!accumulatedText.includes(block.text)) {
              accumulatedText += block.text;
            }
          }
        }
      }

      if (msg.type === "result") {
        if (msg.subtype !== "success") {
          const errors = "errors" in msg ? (msg.errors as string[]) : [];
          onEvent({
            type: "error",
            message: `Agent stopped (${msg.subtype}): ${errors.join("; ") || "unknown error"}`,
          });
        }
        break;
      }
    }
  } catch (err) {
    await supabase.from("sessions").update({ status: "error", updated_at: new Date().toISOString() }).eq("id", sessionId);
    onEvent({ type: "error", message: `Agent error: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }

  // Persist updated claim
  const finalClaim = claimState.claim;
  await supabase
    .from("sessions")
    .update({
      claim: finalClaim,
      agent_session_id: agentSessionId,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  const suggestedPrompts = extractSuggestedPrompts(accumulatedText);

  // Persist the agent response
  await supabase.from("messages").insert({
    session_id: sessionId,
    role: "agent",
    content: accumulatedText,
    suggested_prompts: suggestedPrompts,
  });

  onEvent({
    type: "chat_complete",
    summary: accumulatedText,
    suggestedPrompts,
  });
}

function extractSuggestedPrompts(text: string): string[] {
  const defaults = ["What else should I check?", "Export the claim"];
  const lines = text.split("\n").filter(Boolean);
  const prompts: string[] = [];
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 6); i--) {
    const line = lines[i].trim();
    const match = line.match(/^[-•*]\s*[""]?(.+?)[""]?\s*$/);
    if (match && match[1].endsWith("?")) {
      prompts.unshift(match[1]);
    }
  }
  return prompts.length >= 2 ? prompts.slice(0, 4) : defaults;
}
