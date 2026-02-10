"use client";

import { useState, useMemo } from "react";
import { useStore, useDispatch } from "@/lib/store";
import {
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  Wrench,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "motion/react";
import type { Finding, FindingSeverity } from "@/lib/types";
import {
  revenueAtRisk,
  findingRevenueImpact,
  formatUSD,
} from "@/lib/fee-schedule";

const severityConfig: Record<
  FindingSeverity,
  { icon: typeof AlertCircle; bgClass: string; textClass: string; label: string }
> = {
  critical: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10 border-destructive/20",
    textClass: "text-destructive",
    label: "CRITICAL",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-primary/10 border-primary/20",
    textClass: "text-primary",
    label: "WARNING",
  },
  info: {
    icon: Info,
    bgClass: "bg-info/10 border-info/20",
    textClass: "text-info",
    label: "INFO",
  },
};

function FindingCard({ finding, dollarImpact }: { finding: Finding; dollarImpact?: number }) {
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();
  const config = severityConfig[finding.severity];
  const Icon = config.icon;

  if (finding.resolved) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-success/15 bg-success/5 px-4 py-2.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
          <Check className="h-3 w-3 text-success" aria-hidden="true" />
        </div>
        <span className="text-[13px] text-muted-foreground line-through">
          {finding.title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border ${config.bgClass} transition-colors`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
        >
          <Icon className={`h-3 w-3 ${config.textClass}`} aria-hidden="true" />
        </div>
        <div className="flex flex-1 items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${config.textClass}`}
          >
            {config.label}
          </span>
          <span className="text-[13px] font-medium">{finding.title}</span>
        </div>
        {dollarImpact != null && dollarImpact > 0 && (
          <span className={`shrink-0 rounded-lg px-2 py-0.5 font-mono text-[12px] font-bold ${config.bgClass} ${config.textClass}`}>
            {formatUSD(dollarImpact)}
          </span>
        )}
        <div className="text-muted-foreground/50">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </div>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/20 bg-card/50 px-4 py-3.5">
            <p className="text-[13px] leading-relaxed text-muted-foreground break-words">
              {finding.description}
            </p>
            {finding.recommendation && (
              <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-[12px]">
                  <span className="font-semibold text-foreground/80">
                    Recommendation:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {finding.recommendation}
                  </span>
                </p>
              </div>
            )}
            {(finding.recommendation || finding.sourceUrl) && (
              <div className="mt-3 flex items-center gap-3">
                {finding.recommendation && !finding.resolved && (
                  <button
                    onClick={() =>
                      dispatch({
                        type: "SET_PENDING_FIX_MESSAGE",
                        message: finding.recommendation!,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Wrench className="h-3 w-3" aria-hidden="true" />
                    Fix this
                  </button>
                )}
                {finding.sourceUrl && (
                  <a
                    href={finding.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary/70 transition-colors hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    View source
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FindingsSection() {
  const { claim } = useStore();
  const reducedMotion = useReducedMotion();

  const { sorted, resolvedFindings, activeFindings, atRisk } = useMemo(() => {
    if (!claim) return { sorted: [], resolvedFindings: [], activeFindings: [], atRisk: 0 };
    const active: Finding[] = [];
    const resolved: Finding[] = [];
    for (const f of claim.findings ?? []) {
      (f.resolved ? resolved : active).push(f);
    }
    const order: FindingSeverity[] = ["critical", "warning", "info"];
    const s = [...active].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
    return { sorted: s, resolvedFindings: resolved, activeFindings: active, atRisk: revenueAtRisk(claim) };
  }, [claim]);

  if (!claim) return null;

  const motionTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 350, damping: 30, mass: 1 };

  return (
    <div className="mx-4 mt-5 mb-4">
      <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Findings
      </h3>

      {activeFindings.length > 0 && (
        <p className={`mb-2.5 text-[13px] font-medium ${atRisk > 0 ? "text-destructive" : "text-success"}`}>
          {formatUSD(atRisk)} revenue at risk from {activeFindings.length} unresolved finding{activeFindings.length !== 1 ? "s" : ""}
        </p>
      )}

      {sorted.length === 0 && resolvedFindings.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/15 bg-success/5 px-4 py-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
            <Check className="h-3 w-3 text-success" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-medium text-success">
            No issues found — $0 at risk. Claim looks clean.
          </span>
        </div>
      )}

      <LayoutGroup>
        <motion.div layout={!reducedMotion} transition={motionTransition} className="space-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {sorted.map((f) => (
              <motion.div
                key={f.id}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={motionTransition}
              >
                <FindingCard finding={f} dollarImpact={findingRevenueImpact(f, claim.lineItems ?? [])} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      <AnimatePresence initial={false}>
        {resolvedFindings.length > 0 && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={motionTransition}
            className="mt-3 space-y-1.5"
          >
            <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Resolved
            </h4>
            <AnimatePresence initial={false}>
              {resolvedFindings.map((f) => (
                <motion.div
                  key={f.id}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={motionTransition}
                >
                  <FindingCard finding={f} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
