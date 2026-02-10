"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react";
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
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${config.bgClass} ${config.textClass}`}>
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
            {finding.sourceUrl && (
              <a
                href={finding.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-primary/70 transition-colors hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                View source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FindingsSection() {
  const { claim } = useStore();

  if (!claim) return null;

  const activeFindings: Finding[] = [];
  const resolvedFindings: Finding[] = [];
  for (const f of claim.findings) {
    (f.resolved ? resolvedFindings : activeFindings).push(f);
  }

  const order: FindingSeverity[] = ["critical", "warning", "info"];
  const sorted = [...activeFindings].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );

  const atRisk = revenueAtRisk(claim);

  return (
    <div className="mx-4 mt-5 mb-4">
      <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Findings
      </h3>

      {atRisk > 0 && activeFindings.length > 0 && (
        <p className="mb-2.5 text-[13px] font-medium text-destructive">
          {formatUSD(atRisk)} revenue at risk from {activeFindings.length} unresolved finding{activeFindings.length !== 1 ? "s" : ""}
        </p>
      )}

      {sorted.length === 0 && resolvedFindings.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/15 bg-success/5 px-4 py-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
            <Check className="h-3 w-3 text-success" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-medium text-success">
            No issues found. Claim looks clean.
          </span>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((f) => (
          <FindingCard key={f.id} finding={f} dollarImpact={findingRevenueImpact(f, claim.lineItems)} />
        ))}
      </div>

      {resolvedFindings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Resolved
          </h4>
          {resolvedFindings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}
