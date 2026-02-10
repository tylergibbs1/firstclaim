"use client";

import { useStore } from "@/lib/store";
import { Loader2, ShieldCheck } from "lucide-react";
import type { AnalysisStage } from "@/lib/types";

const stageMessages: Record<AnalysisStage, string[]> = {
  1: [
    "Reading clinical notes…",
    "Identifying diagnoses and procedures…",
    "Extracting patient demographics…",
  ],
  2: [
    "Searching ICD-10 database…",
    "Verifying code specificity…",
    "Researching CPT procedure codes…",
  ],
  3: [
    "Assembling structured claim…",
    "Linking diagnoses to procedures…",
  ],
  4: [
    "Checking NCCI PTP edits…",
    "Verifying MUE limits…",
    "Validating modifier usage…",
  ],
  5: ["Analysis complete."],
};

export function AnalysisState() {
  const { analysisStage } = useStore();
  const messages = stageMessages[analysisStage];

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple/8">
          {analysisStage < 5 ? (
            <Loader2 className="h-7 w-7 animate-spin text-purple" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-7 w-7 text-success" aria-hidden="true" />
          )}
        </div>

        <h2 className="mb-1 text-lg font-semibold tracking-tight">
          {analysisStage < 5
            ? `Stage ${analysisStage} of 5`
            : "Analysis Complete"}
        </h2>

        <div className="mt-3 space-y-1.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground"
            >
              {analysisStage < 5 && i === messages.length - 1 && (
                <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-purple/20 border-t-purple" />
              )}
              <span>{msg}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-1.5" role="progressbar" aria-valuenow={analysisStage} aria-valuemin={1} aria-valuemax={5} aria-label={`Analysis stage ${analysisStage} of 5`}>
          {([1, 2, 3, 4, 5] as const).map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                s < analysisStage
                  ? "w-8 bg-primary"
                  : s === analysisStage
                    ? "w-8 animate-pulse bg-purple"
                    : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
