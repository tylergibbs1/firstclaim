"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Download, Code2, X, FileJson, FileSpreadsheet, Copy, Check } from "lucide-react";
import type { ClaimData } from "@/lib/types";
import { lineItemFee } from "@/lib/fee-schedule";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function claimToCSV(claim: ClaimData): string {
  const headers = ["Line", "CPT", "Description", "Modifiers", "ICD-10", "Units", "Fee"];
  const rows = claim.lineItems.map((li) => [
    li.lineNumber,
    li.cpt,
    `"${li.description.replace(/"/g, '""')}"`,
    `"${li.modifiers.join(", ")}"`,
    `"${li.icd10.join(", ")}"`,
    li.units,
    lineItemFee(li).toFixed(2),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function ActionBar() {
  const { claim } = useStore();
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!claim) return null;

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(claim, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {showJson && (
        <div className="border-t border-border/40 bg-card">
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Raw Claim Data
            </span>
            <button
              onClick={() => setShowJson(false)}
              aria-label="Close JSON preview"
              className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <pre className="max-h-56 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
            {JSON.stringify(claim, null, 2)}
          </pre>
        </div>
      )}

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-border/40 bg-card/90 px-4 py-2 backdrop-blur-md">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 rounded-xl px-4 text-xs shadow-sm">
              <Download className="h-3 w-3" aria-hidden="true" />
              Export Claim
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6}>
            <DropdownMenuItem
              onClick={() =>
                downloadFile(
                  JSON.stringify(claim, null, 2),
                  `claim-${claim.claimId}.json`,
                  "application/json"
                )
              }
            >
              <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
              Download JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                downloadFile(
                  claimToCSV(claim),
                  `claim-${claim.claimId}.csv`,
                  "text/csv"
                )
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={() => setShowJson(!showJson)}
          aria-expanded={showJson}
          className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          <Code2 className="h-3 w-3" aria-hidden="true" />
          {showJson ? "Hide Raw" : "Raw Data"}
        </button>
      </div>
    </>
  );
}
