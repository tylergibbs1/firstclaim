"use client";

import { useState } from "react";
import { useStore, useDispatch } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { AnalysisStage } from "@/lib/types";
import type { DemoScenario } from "@/lib/types";
import { DEMO_NOTES } from "@/lib/mock-data";
import { ArrowRight, FileText } from "lucide-react";

const EXAMPLES: {
  scenario: DemoScenario;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
}[] = [
  {
    scenario: "a",
    title: "Routine Office Visit",
    subtitle: "65M — back pain, radiculopathy",
    badge: "Low Risk",
    badgeClass: "bg-success/10 text-success",
  },
  {
    scenario: "b",
    title: "Dermatology Multi-Procedure",
    subtitle: "45F — skin lesions, 4 procedures",
    badge: "2 Findings",
    badgeClass: "bg-primary/10 text-primary",
  },
  {
    scenario: "c",
    title: "Knee Injury + Red Flag",
    subtitle: "30M — meniscus tear, critical issue",
    badge: "Critical",
    badgeClass: "bg-destructive/10 text-destructive",
  },
];

export function InputState() {
  const { clinicalNotes } = useStore();
  const dispatch = useDispatch();
  const { session } = useAuth();
  const [notes, setNotes] = useState(clinicalNotes);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze() {
    if (!notes.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    dispatch({ type: "SET_CLINICAL_NOTES", notes });
    dispatch({ type: "SET_APP_STATE", state: "analyzing" });
    dispatch({ type: "SET_ANALYSIS_STAGE", stage: 1 as AnalysisStage });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          clinicalNotes: notes,
          patient: { sex: "M", age: 65 }, // TODO: extract from notes or add patient input
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);

            switch (event.type) {
              case "stage": {
                const stage = Math.min(event.stage, 5) as AnalysisStage;
                dispatch({ type: "SET_ANALYSIS_STAGE", stage });
                break;
              }
              case "claim_built":
                dispatch({ type: "SET_CLAIM", claim: event.claim });
                break;
              case "risk_score":
                dispatch({ type: "UPDATE_RISK_SCORE", score: event.score });
                break;
              case "agent_text":
                break;
              case "tool_call":
                dispatch({ type: "SET_ANALYSIS_TOOL_ACTIVITY", tool: event.tool, query: event.query || "" });
                break;
              case "tool_result":
                dispatch({ type: "SET_ANALYSIS_TOOL_RESULT", result: event.result });
                break;
              case "highlights":
                dispatch({ type: "SET_NOTE_HIGHLIGHTS", highlights: event.highlights });
                break;
              case "analysis_complete":
                dispatch({ type: "SET_SESSION_ID", sessionId: event.sessionId });
                if (event.claim) {
                  dispatch({ type: "SET_CLAIM", claim: event.claim });
                }
                if (event.highlights) {
                  dispatch({ type: "SET_NOTE_HIGHLIGHTS", highlights: event.highlights });
                }
                dispatch({
                  type: "ADD_MESSAGE",
                  message: {
                    id: `agent-${Date.now()}`,
                    role: "agent",
                    content: event.summary,
                    timestamp: new Date(),
                    suggestedPrompts: event.suggestedPrompts,
                  },
                });
                dispatch({ type: "SET_ANALYSIS_STAGE", stage: 5 as AnalysisStage });
                dispatch({ type: "SET_APP_STATE", state: "conversation" });
                break;
              case "error":
                console.error("Analysis error:", event.message);
                dispatch({ type: "SET_APP_STATE", state: "input" });
                break;
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      console.error("Analyze fetch error:", err);
      dispatch({ type: "SET_APP_STATE", state: "input" });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const wordCount = notes.length > 0
    ? notes.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-pretty">
            Get it right the first time.
          </h1>
          <p className="text-sm text-muted-foreground text-balance">
            Paste your clinical notes below. The agent will extract codes,
            build a structured claim, and validate it against CMS&nbsp;rules.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/[0.03]">
          <label htmlFor="clinical-notes" className="sr-only">
            Clinical notes
          </label>
          <Textarea
            id="clinical-notes"
            name="clinical-notes"
            autoComplete="off"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your clinical or SOAP notes here…"
            className="min-h-[280px] max-h-[280px] resize-none border-0 bg-transparent px-6 py-5 text-[14.5px] leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-purple/30"
          />
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-5 py-3">
            <span className="text-xs text-muted-foreground">
              {wordCount > 0
                ? `${wordCount} words`
                : "Supports SOAP notes, clinical summaries, and free-text documentation"}
            </span>
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={!notes.trim() || isAnalyzing}
              className="h-9 gap-2 rounded-xl px-5 text-sm font-medium shadow-sm"
            >
              Analyze Claim
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Try an example
          </p>
          <div className="grid grid-cols-3 gap-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.scenario}
                onClick={() => setNotes(DEMO_NOTES[ex.scenario])}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border/50 bg-card px-3.5 py-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
              >
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ex.badgeClass}`}>
                  {ex.badge}
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {ex.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ex.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
