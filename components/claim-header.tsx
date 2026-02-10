"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { RiskScore } from "./risk-score";
import { revenueAtRisk } from "@/lib/fee-schedule";
import { ChevronDown, ChevronUp, Calendar, User } from "lucide-react";

export function ClaimHeader() {
  const { claim, clinicalNotes } = useStore();
  const [notesExpanded, setNotesExpanded] = useState(false);

  if (!claim) return null;

  const patientSummary = [
    claim.patient.age ? `${claim.patient.age}yo` : null,
    claim.patient.sex === "M" ? "Male" : "Female",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="sticky top-0 z-10 border-b border-border/40 bg-card/90 px-5 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <RiskScore score={claim.riskScore} revenueAtRisk={revenueAtRisk(claim)} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <time dateTime={claim.dateOfService}>{claim.dateOfService}</time>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{patientSummary}</span>
          </div>
        </div>
      </div>

      {clinicalNotes && (
        <div className="mt-3">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            aria-expanded={notesExpanded}
            aria-controls="clinical-notes-panel"
            className="flex items-center gap-1 text-[11px] font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {notesExpanded ? "Hide notes" : "View clinical notes"}
            {notesExpanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
          {notesExpanded && (
            <pre
              id="clinical-notes-panel"
              className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/40 bg-muted/40 p-4 font-sans text-xs leading-relaxed text-muted-foreground"
            >
              {clinicalNotes}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
