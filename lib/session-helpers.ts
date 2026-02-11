import type { ChatMessage, MessageRole, ToolActivity } from "@/lib/types";

interface DbMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
  tool_activity?: { tool: string; query: string; status: string; result?: string };
  claim_change?: {
    description: string;
    oldValue?: string;
    newValue?: string;
    riskBefore?: number;
    riskAfter?: number;
    revenueBefore?: number;
    revenueAfter?: number;
  };
  suggested_prompts?: string[];
}

export function transformDbMessages(dbMessages: DbMessage[]): ChatMessage[] {
  return dbMessages.map((m) => ({
    id: m.id,
    role: m.role as MessageRole,
    content: m.content,
    timestamp: new Date(m.created_at),
    toolActivity: m.tool_activity as ToolActivity | undefined,
    claimChange: m.claim_change ?? undefined,
    suggestedPrompts: m.suggested_prompts ?? undefined,
  }));
}
