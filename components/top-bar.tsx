"use client";

import { useStore, useDispatch } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS } from "@/lib/types";
import type { DemoScenario } from "@/lib/types";
import {
  DEMO_NOTES,
  DEMO_CLAIMS,
  DEMO_INITIAL_MESSAGES,
} from "@/lib/mock-data";
import { Plus, Sparkles } from "lucide-react";

const SCENARIOS: { key: DemoScenario; label: string }[] = [
  { key: "a", label: "Clean Claim" },
  { key: "b", label: "With Issues" },
  { key: "c", label: "Complex" },
];

export function TopBar() {
  const { appState, analysisStage, demoScenario } = useStore();
  const dispatch = useDispatch();

  function handleScenario(scenario: DemoScenario) {
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_DEMO_SCENARIO", scenario });
    dispatch({ type: "SET_CLINICAL_NOTES", notes: DEMO_NOTES[scenario] });
    dispatch({ type: "SET_CLAIM", claim: DEMO_CLAIMS[scenario] });
    for (const msg of DEMO_INITIAL_MESSAGES[scenario]) {
      dispatch({ type: "ADD_MESSAGE", message: msg });
    }
    dispatch({ type: "SET_LEFT_PANEL_VIEW", view: "claim" });
    dispatch({ type: "SET_APP_STATE", state: "conversation" });
    dispatch({ type: "SET_ANALYSIS_STAGE", stage: 5 });
  }

  function handleNewClaim() {
    dispatch({ type: "RESET" });
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/60 bg-card/80 px-5 backdrop-blur-xl">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            FirstClaim
          </span>
        </div>

        {(appState === "analyzing" || appState === "conversation") && (
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1" aria-label={`Stage ${analysisStage} of 5`} role="progressbar" aria-valuenow={analysisStage} aria-valuemin={1} aria-valuemax={5}>
              {([1, 2, 3, 4, 5] as const).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    s <= analysisStage
                      ? "scale-100 bg-primary"
                      : "scale-75 bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {appState === "conversation"
                ? "Complete"
                : STAGE_LABELS[analysisStage]}
            </span>
          </div>
        )}
      </div>

      <nav className="flex items-center gap-3" aria-label="Demo scenarios">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-0.5" role="tablist">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={demoScenario === s.key}
              onClick={() => handleScenario(s.key)}
              className={`rounded-lg px-3.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                demoScenario === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {appState !== "input" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewClaim}
            aria-label="Start new claim"
            className="h-8 gap-1 rounded-xl px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New
          </Button>
        )}
      </nav>
    </header>
  );
}
