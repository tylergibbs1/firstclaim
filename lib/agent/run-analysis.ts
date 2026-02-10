import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { makeMcpServer } from "./mcp-server";
import { ANALYSIS_SYSTEM_PROMPT } from "./system-prompt";
import { supabase } from "@/lib/supabase";
import type { ClaimData } from "@/lib/types";
import type { AnalysisSSEEvent } from "@/lib/sse-types";
import type { ClaimState } from "./tools";

// Hoisted regex patterns — avoid re-creation on every streaming chunk
const RE_QUERY = /"query"\s*:\s*"([^"]*)/;
const RE_CODE = /"code"\s*:\s*"([^"]*)/;
const RE_ACTION = /"action"\s*:\s*"([^"]*)/;

interface RunAnalysisOptions {
  clinicalNotes: string;
  patient?: { sex?: "M" | "F"; age?: number };
  userId: string;
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

export async function runAnalysis({ clinicalNotes, patient, userId, onEvent }: RunAnalysisOptions) {
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

  let agentSessionId: string | undefined;
  let accumulatedText = "";
  let inTool = false;
  let toolInputBuffer = "";
  let currentToolName = "";

  try {
    const response = query({
      prompt: streamPrompt(prompt),
      options: {
        systemPrompt: ANALYSIS_SYSTEM_PROMPT,
        model: "claude-opus-4-6",
        mcpServers: { billing: mcpServer },
        allowedTools: ["mcp__billing__*", "WebSearch"],
        includePartialMessages: true,
        maxTurns: 100,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    });

    for await (const message of response) {
      // Capture session ID on init
      if (message.type === "system" && message.subtype === "init") {
        agentSessionId = message.session_id;
      }

      // Stream text and tool-call deltas in real-time
      if (message.type === "stream_event") {
        const event = message.event;

        if (event.type === "content_block_start") {
          const block = (event as Record<string, unknown>).content_block as Record<string, unknown> | undefined;
          if (block?.type === "tool_use") {
            inTool = true;
            currentToolName = (block.name as string || "").replace("mcp__billing__", "");
            toolInputBuffer = "";
            // Advance stage based on which tool is starting
            if (currentToolName === "search_icd10" || currentToolName === "lookup_icd10") {
              emitStage(2);
            } else if (currentToolName === "add_highlights") {
              // Fires within Stage 2, no stage change needed
            } else if (currentToolName === "check_age_sex") {
              emitStage(4);
            }
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

      // Complete assistant messages — detect tool calls for stage advancement
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("name" in block && block.type === "tool_use") {
            const toolName = block.name.replace("mcp__billing__", "");
            const input = block.input as Record<string, unknown>;

            if (toolName === "update_claim") {
              const action = input.action as string;
              if (action === "set") emitStage(3);
              else if (action === "add_finding") emitStage(4);
              else if (action === "set_risk_score") emitStage(4);
            }
          }
        }
      }

      // Also accumulate text from complete assistant messages as fallback
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block && block.type === "text") {
            // Only use this if streaming didn't capture it (no-op if already accumulated)
            if (!accumulatedText.includes(block.text)) {
              accumulatedText += block.text;
            }
          }
        }
      }

      if (message.type === "result") {
        if (message.subtype !== "success") {
          const errors = "errors" in message ? (message.errors as string[]) : [];
          onEvent({
            type: "error",
            message: `Agent stopped (${message.subtype}): ${errors.join("; ") || "unknown error"}`,
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

  const finalClaim = claimState.claim;
  const finalHighlights = claimState.highlights;
  const suggestedPrompts = claimState.suggestedPrompts.length >= 2
    ? claimState.suggestedPrompts
    : extractSuggestedPrompts(accumulatedText);
  const chatSummary = finalClaim ? buildChatSummary(finalClaim) : accumulatedText;

  // Emit completion event immediately so the UI transitions without waiting for DB
  onEvent({
    type: "analysis_complete",
    sessionId,
    claim: finalClaim!,
    summary: chatSummary,
    suggestedPrompts,
    highlights: finalHighlights.length > 0 ? finalHighlights : undefined,
  });

  // Persist to Supabase in background (don't block the response)
  Promise.all([
    supabase
      .from("sessions")
      .update({
        claim: finalClaim,
        highlights: finalHighlights,
        agent_session_id: agentSessionId,
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
}

function buildChatSummary(claim: ClaimData): string {
  const openFindings = claim.findings.filter((f) => !f.resolved);
  const critical = openFindings.filter((f) => f.severity === "critical");
  const warnings = openFindings.filter((f) => f.severity === "warning");

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
