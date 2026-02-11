"use client";

import { useClaim, useApp, useDispatch } from "@/lib/store";
import { revenueAtRisk, formatUSD } from "@/lib/fee-schedule";
import NumberFlow from "@number-flow/react";
import { Calendar, User } from "lucide-react";
import type { LeftPanelView } from "@/lib/types";

const TABS: { key: LeftPanelView; label: string }[] = [
  { key: "claim", label: "Claim" },
  { key: "notes", label: "Notes" },
];

function getRiskLevel(score: number) {
  if (score <= 25) return { label: "Low", color: "success" } as const;
  if (score <= 50) return { label: "Medium", color: "warning" } as const;
  return { label: "High", color: "destructive" } as const;
}

const riskColors = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

export function ClaimHeader() {
  const { claim, previousClaim } = useClaim();
  const { leftPanelView } = useApp();
  const dispatch = useDispatch();

  if (!claim) return null;

  const { label: riskLabel, color } = getRiskLevel(claim.riskScore);
  const revenue = revenueAtRisk(claim);

  const patientSummary = [
    claim.patient.age ? `${claim.patient.age}yo` : null,
    claim.patient.sex === "M" ? "Male" : "Female",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="sticky top-0 z-10 border-b border-border/40 bg-card/90 px-5 py-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        {/* Left: tabs */}
        <div
          className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-0.5"
          role="tablist"
          aria-label="Panel view"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={leftPanelView === tab.key}
              onClick={() => dispatch({ type: "SET_LEFT_PANEL_VIEW", view: tab.key })}
              className={`rounded-lg px-3.5 py-1 text-[11px] font-medium transition-colors duration-200 ${
                leftPanelView === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.key === "claim" && leftPanelView !== "claim" && previousClaim && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Center: meta */}
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
          <time dateTime={claim.dateOfService}>
            {new Date(claim.dateOfService + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span className="opacity-30">·</span>
          <User className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{patientSummary}</span>
        </div>

        {/* Right: revenue + risk badge */}
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-semibold tabular-nums ${revenue > 0 ? "text-destructive" : "text-success"}`}>
            {formatUSD(revenue)} at risk
          </span>
          <div
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-bold tabular-nums ring-1 ring-current/20 ${riskColors[color]}`}
            aria-label={`Risk score: ${claim.riskScore}, ${riskLabel}`}
          >
            <NumberFlow value={claim.riskScore} />
            <span className="font-medium">{riskLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
