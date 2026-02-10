"use client";

import { useMemo } from "react";
import { useStore, useDispatch } from "@/lib/store";
import { DEMO_HIGHLIGHTS } from "@/lib/mock-data";
import type { NoteHighlight, ChatMessage } from "@/lib/types";
import { X } from "lucide-react";

interface TextSegment {
  text: string;
  highlight: NoteHighlight | null;
}

function buildSegments(
  text: string,
  highlights: NoteHighlight[]
): TextSegment[] {
  const positions: { start: number; end: number; highlight: NoteHighlight }[] =
    [];

  for (const h of highlights) {
    const idx = text.indexOf(h.original_text);
    if (idx === -1) continue;
    positions.push({ start: idx, end: idx + h.original_text.length, highlight: h });
  }

  // Sort by start position, then by length descending to prefer longer matches
  positions.sort((a, b) => a.start - b.start || b.end - a.end);

  // Remove overlapping positions (keep earlier / longer ones)
  const filtered: typeof positions = [];
  let lastEnd = 0;
  for (const pos of positions) {
    if (pos.start >= lastEnd) {
      filtered.push(pos);
      lastEnd = pos.end;
    }
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const pos of filtered) {
    if (pos.start > cursor) {
      segments.push({ text: text.slice(cursor, pos.start), highlight: null });
    }
    segments.push({
      text: text.slice(pos.start, pos.end),
      highlight: pos.highlight,
    });
    cursor = pos.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: null });
  }

  return segments;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const isLow = confidence < 0.7;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${
            isLow ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium tabular-nums ${
          isLow ? "text-destructive" : "text-foreground"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

function DetailPanel({ highlight }: { highlight: NoteHighlight }) {
  const dispatch = useDispatch();

  function handleAlternativeClick(altCode: string) {
    const msg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `What about using ${altCode} instead of ${highlight.code}?`,
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", message: msg });

    setTimeout(() => {
      const toolMsg: ChatMessage = {
        id: `tool-${Date.now()}`,
        role: "tool",
        content: "Searching CMS guidelines...",
        timestamp: new Date(),
        toolActivity: {
          tool: "WebSearch",
          query: `${altCode} vs ${highlight.code}`,
          status: "searching",
        },
      };
      dispatch({ type: "ADD_MESSAGE", message: toolMsg });
    }, 500);

    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: `I understand your question about using ${altCode} instead of ${highlight.code}. In a live session, I would search CMS guidelines and the ICD-10 database to give you a detailed answer with source citations. This is a demo preview of the conversation interface.`,
        timestamp: new Date(),
        suggestedPrompts: [
          "Tell me more",
          "What else should I check?",
          "Export the claim",
        ],
      };
      dispatch({ type: "ADD_MESSAGE", message: agentMsg });
    }, 2000);
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border/40 bg-card/80">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <h3 className="text-xs font-semibold text-foreground">
          Code Detail
        </h3>
        <button
          onClick={() =>
            dispatch({ type: "SET_SELECTED_HIGHLIGHT", highlight: null })
          }
          aria-label="Close detail panel"
          className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {highlight.code}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
              highlight.type === "cpt"
                ? "bg-purple/10 text-purple"
                : "bg-primary/10 text-primary"
            }`}
          >
            {highlight.type === "cpt" ? "CPT" : "ICD-10"}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Matched Text
          </div>
          <p className="mt-1 text-xs leading-relaxed text-foreground/80">
            &ldquo;{highlight.original_text}&rdquo;
          </p>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Confidence
          </div>
          <div className="mt-1.5">
            <ConfidenceBar confidence={highlight.confidence} />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Rationale
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {highlight.notes}
          </p>
        </div>

        {highlight.alternatives.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Alternatives
            </div>
            <div className="mt-1.5 space-y-1.5">
              {highlight.alternatives.map((alt) => (
                <button
                  key={alt.code}
                  onClick={() => handleAlternativeClick(alt.code)}
                  className="flex w-full items-start gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="shrink-0 text-xs font-semibold text-foreground">
                    {alt.code}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {alt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotesView() {
  const { clinicalNotes, demoScenario, selectedHighlight } = useStore();
  const dispatch = useDispatch();

  const highlights = demoScenario ? DEMO_HIGHLIGHTS[demoScenario] ?? [] : [];

  const segments = useMemo(
    () => buildSegments(clinicalNotes, highlights),
    [clinicalNotes, highlights]
  );

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-5">
        <div className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-muted-foreground">
          {segments.map((seg, i) => {
            if (!seg.highlight) {
              return <span key={i}>{seg.text}</span>;
            }

            const isActive = selectedHighlight?.id === seg.highlight.id;
            const isLow = seg.highlight.confidence < 0.7;

            return (
              <button
                key={i}
                onClick={() =>
                  dispatch({
                    type: "SET_SELECTED_HIGHLIGHT",
                    highlight:
                      isActive ? null : seg.highlight,
                  })
                }
                className={`cursor-pointer border-b-2 transition-all ${
                  isLow
                    ? "border-destructive"
                    : "border-primary"
                } ${
                  isActive
                    ? isLow
                      ? "bg-destructive/15 text-foreground"
                      : "bg-primary/15 text-foreground"
                    : "hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                {seg.text}
              </button>
            );
          })}
        </div>
      </div>

      {selectedHighlight && <DetailPanel highlight={selectedHighlight} />}
    </div>
  );
}
