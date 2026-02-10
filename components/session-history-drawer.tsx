"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/auth-provider";
import { useDispatch } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { MessageSquare } from "lucide-react";

interface SessionSummary {
  id: string;
  createdAt: string;
  clinicalNotesPreview: string;
  riskScore: number | null;
  messageCount: number;
}

const shortDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return shortDateFormat.format(new Date(iso));
}

function riskBadgeColor(score: number): string {
  if (score <= 25) return "bg-green-500/15 text-green-700";
  if (score <= 50) return "bg-yellow-500/15 text-yellow-700";
  if (score <= 75) return "bg-orange-500/15 text-orange-700";
  return "bg-red-500/15 text-red-700";
}

export function SessionHistoryDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { session: authSession } = useAuth();
  const dispatch = useDispatch();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    const token = authSession?.access_token;
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } finally {
      setLoading(false);
    }
  }, [authSession?.access_token]);

  useEffect(() => {
    if (open) fetchSessions();
  }, [open, fetchSessions]);

  async function handleRestore(id: string) {
    const token = authSession?.access_token;
    if (!token) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { session, messages: dbMessages } = await res.json();

      const messages: ChatMessage[] = dbMessages.map(
        (m: {
          id: string;
          role: string;
          content: string;
          created_at: string;
          tool_activity?: { tool: string; query: string; status: string; result?: string };
          claim_change?: { description: string; oldValue?: string; newValue?: string; riskBefore?: number; riskAfter?: number; revenueBefore?: number; revenueAfter?: number };
          suggested_prompts?: string[];
        }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
          toolActivity: m.tool_activity ?? undefined,
          claimChange: m.claim_change ?? undefined,
          suggestedPrompts: m.suggested_prompts ?? undefined,
        })
      );

      dispatch({
        type: "RESTORE_SESSION",
        sessionId: session.id,
        clinicalNotes: session.clinical_notes ?? "",
        claim: session.claim,
        highlights: session.highlights ?? [],
        messages,
      });
      onOpenChange(false);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b border-border/60 px-4 py-3">
          <SheetTitle className="text-sm font-semibold">
            Session History
          </SheetTitle>
          <SheetDescription className="text-xs">
            Restore a previous analysis
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 rounded-xl bg-muted/50 p-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No completed sessions yet
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleRestore(s.id)}
                  disabled={loadingId !== null}
                  className="group flex w-full flex-col gap-1.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {relativeDate(s.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {s.riskScore !== null && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${riskBadgeColor(s.riskScore)}`}
                        >
                          {s.riskScore}%
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {s.messageCount} message{s.messageCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-xs text-foreground/80">
                    {s.clinicalNotesPreview || "No notes"}
                    {(s.clinicalNotesPreview?.length ?? 0) >= 60 ? "…" : ""}
                  </p>
                  {loadingId === s.id && (
                    <span className="text-[10px] text-primary">Loading…</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
