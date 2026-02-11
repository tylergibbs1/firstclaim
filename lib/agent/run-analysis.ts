import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { makeMcpServer } from "./mcp-server";
import { StreamProcessor } from "./stream-processor";
import { ANALYSIS_SYSTEM_PROMPT } from "./system-prompt";
import { supabase } from "@/lib/supabase";
import type { ClaimData } from "@/lib/types";
import type { AnalysisSSEEvent } from "@/lib/sse-types";
import type { ClaimState } from "./tools";

interface RunAnalysisOptions {
  clinicalNotes: string;
  patient?: { sex?: "M" | "F"; age?: number };
  userId: string;
  abortController?: AbortController;
  onEvent: (event: AnalysisSSEEvent) => void;
}

/**
 * Wraps a plain string into a streaming async generator that yields
 * a single SDKUserMessage. Required for MCP tool support.
 */
async function* streamPrompt(content: string): AsyncIterable<SDKUserMessage> {
  yield {
    type: "user",
    message: { role: "user", content },
    parent_tool_use_id: null,
    session_id: "",
  };
}

export async function runAnalysis({ clinicalNotes, patient, userId, abortController, onEvent }: RunAnalysisOptions) {
  // Create session in Supabase (set status in initial insert to avoid a second round-trip)
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .insert({ clinical_notes: clinicalNotes, user_id: userId, status: "processing" })
    .select("id")
    .single();

  if (sessionErr || !session) {
    onEvent({ type: "error", message: `Failed to create session: ${sessionErr?.message}` });
    return;
  }

  const sessionId = session.id;

  // Mutable claim state — the only way the agent modifies the claim
  const claimState: ClaimState = {
    claim: null,
    highlights: [],
    suggestedPrompts: [],
    onClaimUpdate: (claim: ClaimData) => {
      claimState.claim = claim;
      onEvent({ type: "claim_built", claim });
      if (claim.riskScore > 0) {
        onEvent({ type: "risk_score", score: claim.riskScore });
      }
      for (const finding of claim.findings) {
        onEvent({ type: "finding", finding });
      }
    },
    onHighlightsUpdate: (highlights) => {
      onEvent({ type: "highlights", highlights });
    },
    onToolResult: (tool, result) => {
      onEvent({ type: "tool_result", tool, result });
    },
  };

  const mcpServer = makeMcpServer(claimState);

  // Stage tracking
  let currentStage = 0;
  const stageLabels = [
    "Extracting diagnoses...",
    "Assigning codes...",
    "Building claim...",
    "Validating rules...",
    "Complete",
  ];

  function emitStage(stage: number) {
    if (stage > currentStage && stage <= 5) {
      currentStage = stage;
      onEvent({ type: "stage", stage, label: stageLabels[stage - 1] });
    }
  }

  emitStage(1);

  const patientParts: string[] = [];
  if (patient?.sex) patientParts.push(patient.sex);
  if (patient?.age) patientParts.push(`age ${patient.age}`);
  const patientLine = patientParts.length > 0
    ? `\nPatient: ${patientParts.join(", ")}`
    : "\nExtract patient demographics (sex, age) from the clinical notes if mentioned.";

  const prompt = `Analyze these clinical notes and build a complete medical claim.
${patientLine}

Clinical Notes:
${clinicalNotes}

Follow your 5-stage pipeline. Use your tools to search codes, build the claim, and validate it.`;

  const processor = new StreamProcessor({
    onText: (text) => onEvent({ type: "agent_text", text }),
    onToolStart: (toolName) => {
      if (toolName === "search_icd10" || toolName === "lookup_icd10") emitStage(2);
      else if (toolName === "check_age_sex") emitStage(4);
      onEvent({ type: "tool_call", tool: toolName, query: "" });
    },
    onToolInput: (toolName, extracted) => {
      onEvent({ type: "tool_call", tool: toolName, query: extracted });
    },
    onAssistantToolUse: (toolName, input) => {
      if (toolName === "update_claim") {
        const action = input.action as string;
        if (action === "set") emitStage(3);
        else if (action === "add_finding") emitStage(4);
        else if (action === "set_risk_score") emitStage(4);
      }
    },
    onError: (message) => onEvent({ type: "error", message }),
  });

  try {
    const response = query({
      prompt: streamPrompt(prompt),
      options: {
        abortController,
        systemPrompt: ANALYSIS_SYSTEM_PROMPT,
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

    for await (const message of response) {
      if (processor.process(message)) break;
    }
  } catch (err) {
    // Client disconnected — exit silently
    if (abortController?.signal.aborted) return;

    await supabase.from("sessions").update({ status: "error", updated_at: new Date().toISOString() }).eq("id", sessionId);
    onEvent({ type: "error", message: `Agent error: ${err instanceof Error ? err.message : String(err)}` });
    return;
  }

  const finalClaim = claimState.claim;
  const finalHighlights = claimState.highlights;
  const suggestedPrompts = claimState.suggestedPrompts.length >= 2
    ? claimState.suggestedPrompts
    : extractSuggestedPrompts(processor.accumulatedText);
  const chatSummary = finalClaim ? buildChatSummary(finalClaim) : processor.accumulatedText;

  // Persist to Supabase BEFORE emitting completion — the chat API loads the
  // session from DB, so the claim must be written before the client can send
  // a follow-up message. (Fire-and-forget here caused a race condition where
  // the chat agent saw a null claim.)
  await Promise.all([
    supabase
      .from("sessions")
      .update({
        claim: finalClaim,
        highlights: finalHighlights,
        agent_session_id: processor.agentSessionId,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId),
    supabase.from("messages").insert({
      session_id: sessionId,
      role: "agent",
      content: chatSummary,
      suggested_prompts: suggestedPrompts,
    }),
  ]).catch((err) => console.error("Failed to persist analysis results:", err));

  // Emit completion event after DB write so the chat API can load the claim
  onEvent({
    type: "analysis_complete",
    sessionId,
    claim: finalClaim!,
    summary: chatSummary,
    suggestedPrompts,
    highlights: finalHighlights.length > 0 ? finalHighlights : undefined,
  });
}

function buildChatSummary(claim: ClaimData): string {
  const openFindings = (claim.findings ?? []).filter((f) => !f.resolved);
  const critical = openFindings.filter((f) => f.severity === "critical");

  const lines: string[] = [];

  // Opening line — warm, concise
  if (openFindings.length === 0) {
    lines.push(`Claim looks clean — **${claim.lineItems.length} line items**, no issues found.`);
  } else if (critical.length > 0) {
    lines.push(`Heads up — found **${openFindings.length} issue${openFindings.length > 1 ? "s" : ""}** across ${claim.lineItems.length} line items. Here's the quick read:`);
  } else {
    lines.push(`${claim.lineItems.length} line items built. A few things to look at:`);
  }

  // Top 3 findings as bullets
  const topFindings = openFindings.slice(0, 3);
  for (const f of topFindings) {
    const tag = f.severity === "critical" ? "**Critical**" : f.severity === "warning" ? "**Warning**" : "**Info**";
    lines.push(`- ${tag} — ${f.title}`);
  }
  if (openFindings.length > 3) {
    lines.push(`- Plus ${openFindings.length - 3} more in the findings panel.`);
  }

  return lines.join("\n");
}

function extractSuggestedPrompts(text: string): string[] {
  const defaults = [
    "Walk me through the findings",
    "Show the biggest risks",
    "Export the claim",
  ];

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
