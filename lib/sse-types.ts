import type { ClaimData, Finding, NoteHighlight } from "./types";

/** Events emitted during initial analysis */
export type AnalysisSSEEvent =
  | { type: "stage"; stage: number; label: string }
  | { type: "agent_text"; text: string }
  | { type: "tool_call"; tool: string; query: string }
  | { type: "tool_result"; tool: string; result: string }
  | { type: "claim_built"; claim: ClaimData }
  | { type: "finding"; finding: Finding }
  | { type: "risk_score"; score: number }
  | { type: "highlights"; highlights: NoteHighlight[] }
  | {
      type: "analysis_complete";
      sessionId: string;
      claim: ClaimData;
      summary: string;
      suggestedPrompts: string[];
      highlights?: NoteHighlight[];
    }
  | { type: "error"; message: string };

/** Events emitted during chat turns */
export type ChatSSEEvent =
  | { type: "agent_text"; text: string }
  | { type: "tool_call"; tool: string; query: string }
  | { type: "tool_result"; tool: string; result: string }
  | { type: "claim_updated"; claim: ClaimData }
  | { type: "finding_added"; finding: Finding }
  | { type: "finding_resolved"; findingId: string; reason: string }
  | { type: "risk_score_updated"; score: number }
  | {
      type: "chat_complete";
      summary: string;
      suggestedPrompts: string[];
    }
  | { type: "error"; message: string };

export type SSEEvent = AnalysisSSEEvent | ChatSSEEvent;
