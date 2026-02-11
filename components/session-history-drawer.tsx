"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/auth-provider";
import { useDispatch } from "@/lib/store";
import { transformDbMessages } from "@/lib/session-helpers";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Trash2 } from "lucide-react";

interface SessionSummary {
  id: string;
  createdAt: string;
  clinicalNotesPreview: string;
  riskScore: number | null;
  messageCount: number;
}

let cachedSessions: SessionSummary[] | null = null;
let cacheTimestamp = 0;
let cacheUserId: string | null = null;
const CACHE_TTL = 30_000;

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
  if (score <= 25) return "bg-success/15 text-success";
  if (score <= 50) return "bg-warning/15 text-warning";
  if (score <= 75) return "bg-primary/15 text-primary";
  return "bg-destructive/15 text-destructive";
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
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const userId = authSession?.user?.id ?? null;

  const fetchSessions = useCallback(async () => {
    const token = authSession?.access_token;
    if (!token || !userId) return;
    if (cachedSessions && cacheUserId === userId && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSessions(cachedSessions);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        cachedSessions = data.sessions;
        cacheTimestamp = Date.now();
        cacheUserId = userId;
        setSessions(data.sessions);
      }
    } finally {
      setLoading(false);
    }
  }, [authSession?.access_token, userId]);

  useEffect(() => {
    if (open) fetchSessions();
  }, [open, fetchSessions]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const token = authSession?.access_token;
    if (!token) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    cachedSessions = cachedSessions?.filter((s) => s.id !== id) ?? null;
    await fetch(`/api/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  const filteredSessions = search
    ? sessions.filter((s) =>
        s.clinicalNotesPreview.toLowerCase().includes(search.toLowerCase())
      )
    : sessions;

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

      dispatch({
        type: "RESTORE_SESSION",
        sessionId: session.id,
        clinicalNotes: session.clinical_notes ?? "",
        claim: session.claim,
        highlights: session.highlights ?? [],
        messages: transformDbMessages(dbMessages),
      });
      onOpenChange(false);
      router.push(`/sessions/${id}`);
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

        <div className="relative px-3 py-2 border-b border-border/60">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            aria-label="Search sessions"
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>

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
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "No matching sessions" : "No completed sessions yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredSessions.map((s) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadingId === null && handleRestore(s.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadingId === null && handleRestore(s.id); } }}
                  className={`group flex w-full flex-col gap-1.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60 cursor-pointer${loadingId !== null ? " opacity-50 pointer-events-none" : ""}`}
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
                      <button
                        onClick={(e) => handleDelete(e, s.id)}
                        aria-label="Delete session"
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 focus-visible:bg-destructive/10 text-muted-foreground hover:text-destructive focus-visible:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-xs text-foreground/80">
                    {s.clinicalNotesPreview || "No notes"}
                    {(s.clinicalNotesPreview?.length ?? 0) >= 60 ? "…" : ""}
                  </p>
                  {loadingId === s.id && (
                    <span className="text-[10px] text-primary">Loading…</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
