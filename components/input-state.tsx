"use client";

import { useState } from "react";
import { useStore, useDispatch } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DEMO_NOTES,
  DEMO_CLAIMS,
  DEMO_INITIAL_MESSAGES,
} from "@/lib/mock-data";
import type { AnalysisStage, DemoScenario } from "@/lib/types";
import { ArrowRight, FileText } from "lucide-react";

export function InputState() {
  const { clinicalNotes } = useStore();
  const dispatch = useDispatch();
  const [notes, setNotes] = useState(clinicalNotes);

  function handleAnalyze() {
    if (!notes.trim()) return;
    dispatch({ type: "SET_CLINICAL_NOTES", notes });
    dispatch({ type: "SET_APP_STATE", state: "analyzing" });

    const stages: AnalysisStage[] = [1, 2, 3, 4, 5];
    const delays = [0, 800, 1800, 2800, 4000];

    stages.forEach((stage, i) => {
      setTimeout(() => {
        dispatch({ type: "SET_ANALYSIS_STAGE", stage });
        if (stage === 5) {
          const scenario: DemoScenario = "a";
          dispatch({ type: "SET_CLAIM", claim: DEMO_CLAIMS[scenario] });
          for (const msg of DEMO_INITIAL_MESSAGES[scenario]) {
            dispatch({ type: "ADD_MESSAGE", message: msg });
          }
          setTimeout(() => {
            dispatch({ type: "SET_APP_STATE", state: "conversation" });
          }, 600);
        }
      }, delays[i]);
    });
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your clinical or SOAP notes here…"
            className="min-h-[280px] resize-none border-0 bg-transparent px-6 py-5 text-[14.5px] leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-purple/30"
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
              disabled={!notes.trim()}
              className="h-9 gap-2 rounded-xl px-5 text-sm font-medium shadow-sm"
            >
              Analyze Claim
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
