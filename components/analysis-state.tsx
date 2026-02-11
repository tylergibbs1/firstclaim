"use client";

import { useRef, useEffect, useState } from "react";
import { useAnalysis } from "@/lib/store";
import {
  ShieldCheck,
  Sparkles,
  Check,
  Search,
  BookOpenText,
  UserCheck,
  PenLine,
  Highlighter,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Shimmer } from "@/components/ui/shimmer";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { AnalysisStage } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tool metadata                                                      */
/* ------------------------------------------------------------------ */

function getToolMeta(tool: string, query: string): { icon: LucideIcon; label: string; detail: string } {
  switch (tool) {
    case "search_icd10":
      return { icon: Search, label: "Search ICD-10", detail: query };
    case "lookup_icd10":
      return { icon: BookOpenText, label: "Lookup Code", detail: query };
    case "check_age_sex":
      return { icon: UserCheck, label: "Validate Demographics", detail: query };
    case "update_claim": {
      const labels: Record<string, string> = {
        set: "Build Claim",
        add_finding: "Record Finding",
        set_risk_score: "Calculate Risk",
        add_line_item: "Add Line Item",
        remove_line_item: "Remove Line Item",
        resolve_finding: "Resolve Finding",
      };
      return { icon: PenLine, label: labels[query] || "Update Claim", detail: "" };
    }
    case "add_highlights":
      return { icon: Highlighter, label: "Map Highlights", detail: "" };
    case "WebSearch":
      return { icon: Globe, label: "Web Search", detail: query };
    default:
      return { icon: Search, label: tool.replace(/_/g, " "), detail: query };
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ToolCard {
  id: number;
  tool: string;
  query: string;
  result?: string;
}

const stageLabels: Record<AnalysisStage, string> = {
  1: "Reading clinical notes",
  2: "Searching code databases",
  3: "Building structured claim",
  4: "Validating compliance rules",
  5: "Analysis complete",
};

/* ------------------------------------------------------------------ */
/*  Card component                                                     */
/* ------------------------------------------------------------------ */

const SPRING_TRANSITION = { type: "spring" as const, stiffness: 400, damping: 35, mass: 0.5 };
const INSTANT_TRANSITION = { duration: 0 };

function ToolCardRow({ card, isActive }: { card: ToolCard; isActive: boolean }) {
  const meta = getToolMeta(card.tool, card.query);
  const Icon = meta.icon;
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      layout={!reducedMotion}
      initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? INSTANT_TRANSITION : SPRING_TRANSITION}
      className={`rounded-xl border px-3 py-2.5 text-left transition-colors duration-300 ${
        isActive
          ? "border-purple/20 bg-purple/[0.03] shadow-sm"
          : "border-border/40 bg-card/60"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
            isActive ? "bg-purple/10" : "bg-success/10"
          }`}
        >
          {isActive ? (
            <Icon className="h-3 w-3 text-purple" aria-hidden="true" />
          ) : (
            <Check className="h-3 w-3 text-success" aria-hidden="true" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            {isActive ? (
              <Shimmer
                as="span"
                className="text-[12px] font-medium leading-tight"
                duration={2}
                spread={2}
              >
                {meta.label}
              </Shimmer>
            ) : (
              <span className="text-[12px] font-medium leading-tight text-foreground">
                {meta.label}
              </span>
            )}
            {meta.detail && (
              <span className="truncate text-[11px] leading-tight text-muted-foreground">
                {meta.detail}
              </span>
            )}
          </div>

          {/* Result — morphs in */}
          <AnimatePresence>
            {card.result && (
              <motion.p
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
                className="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground/80"
              >
                {card.result}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AnalysisState() {
  const { analysisStage, analysisToolActivity } = useAnalysis();
  const isDone = analysisStage >= 5;

  /* Card state */
  const [cards, setCards] = useState<ToolCard[]>([]);
  const activeToolRef = useRef<string | null>(null);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Track tool calls → cards */
  useEffect(() => {
    if (!analysisToolActivity) return;
    const { tool, query, result } = analysisToolActivity;

    if (tool !== activeToolRef.current) {
      // New tool — push a new card
      activeToolRef.current = tool;
      idRef.current += 1;
      setCards((prev) => [...prev, { id: idRef.current, tool, query, result }]);
    } else {
      // Same tool — update last card's query / result
      setCards((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.tool !== tool) return prev;
        return [
          ...prev.slice(0, -1),
          { ...last, query: query || last.query, result: result || last.result },
        ];
      });
    }
  }, [analysisToolActivity]);

  /* Auto-scroll to newest card */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [cards]);

  /* Reset on new analysis */
  useEffect(() => {
    if (analysisStage === 1) {
      setCards([]);
      activeToolRef.current = null;
    }
  }, [analysisStage]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-lg text-center">
        {/* Header icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple/8">
          {isDone ? (
            <ShieldCheck className="h-6 w-6 text-success" aria-hidden="true" />
          ) : (
            <Sparkles className="h-6 w-6 text-purple" aria-hidden="true" />
          )}
        </div>

        {/* Stage label */}
        {isDone ? (
          <h2 className="mb-1 text-lg font-semibold tracking-tight">
            Analysis Complete
          </h2>
        ) : (
          <Shimmer as="h2" className="mb-1 text-lg font-semibold tracking-tight" duration={3} spread={1}>
            {`Stage ${analysisStage} of 5 — ${stageLabels[analysisStage]}`}
          </Shimmer>
        )}

        {/* Card feed */}
        {!isDone && cards.length > 0 && (
          <div
            ref={scrollRef}
            className="mx-auto mt-6 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-2xl scrollbar-none"
          >
            <div className="flex flex-col gap-2 px-1">
              {cards.map((card) => (
                <ToolCardRow
                  key={card.id}
                  card={card}
                  isActive={!card.result && card.id === cards[cards.length - 1]?.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div
          className="mt-8 flex justify-center gap-1.5"
          role="progressbar"
          aria-valuenow={analysisStage}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-label={`Analysis stage ${analysisStage} of 5`}
        >
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
