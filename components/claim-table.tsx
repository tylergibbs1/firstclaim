"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { ClaimLineItem } from "@/lib/types";
import { lineItemFee, totalClaimValue, formatUSD } from "@/lib/fee-schedule";

function LineItemRow({
  item,
  hasActiveFinding,
}: {
  item: ClaimLineItem;
  hasActiveFinding: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`group border-b border-border/30 transition-colors hover:bg-muted/40 ${
          hasActiveFinding ? "border-l-[3px] border-l-primary" : ""
        }`}
      >
        <td className="w-10 py-3 pr-2 text-right text-xs tabular-nums text-muted-foreground">
          {item.lineNumber}
        </td>
        <td className="w-24 py-3 pr-3">
          <span className="font-mono text-sm font-semibold">{item.cpt}</span>
        </td>
        <td className="min-w-0 py-3 pr-3 text-[13px] break-words">{item.description}</td>
        <td className="w-20 py-3 pr-3">
          {item.modifiers.length > 0 ? (
            <div className="flex gap-1">
              {item.modifiers.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center rounded-md bg-purple/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-purple"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-border">--</span>
          )}
        </td>
        <td className="w-32 py-3 pr-3">
          <div className="flex flex-wrap gap-1">
            {item.icd10.map((code) => (
              <span
                key={code}
                className="inline-flex rounded-md border border-tertiary/20 bg-tertiary/8 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground/80"
              >
                {code}
              </span>
            ))}
          </div>
        </td>
        <td className="w-12 py-3 pr-2 text-center font-mono text-sm tabular-nums">
          {item.units}
        </td>
        <td
          className={`w-16 py-3 pr-2 text-right font-mono text-sm tabular-nums ${
            hasActiveFinding
              ? "font-bold text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {formatUSD(lineItemFee(item))}
        </td>
        <td className="w-8 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} line ${item.lineNumber} details`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground group-hover:text-muted-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="border-b border-border/20 bg-muted/20">
            <div className="px-6 py-3.5">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {item.codingRationale}
              </p>
              {item.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {item.sources.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary/70 transition-colors hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      Source {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ClaimTable() {
  const { claim } = useStore();

  if (!claim) return null;

  const findingLines = new Set(
    claim.findings
      .filter((f) => !f.resolved && f.relatedLineNumber)
      .map((f) => f.relatedLineNumber)
  );

  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-xl border border-border/50 bg-card">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="w-10 py-2.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              #
            </th>
            <th className="w-24 py-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              CPT
            </th>
            <th className="py-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Description
            </th>
            <th className="w-20 py-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Mod
            </th>
            <th className="w-32 py-2.5 pr-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Dx
            </th>
            <th className="w-12 py-2.5 pr-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Qty
            </th>
            <th className="w-16 py-2.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Fee
            </th>
            <th className="w-8 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {claim.lineItems.map((item) => (
            <LineItemRow
              key={item.lineNumber}
              item={item}
              hasActiveFinding={findingLines.has(item.lineNumber)}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border/40 bg-muted/30">
            <td colSpan={6} className="py-2.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total
            </td>
            <td className="w-16 py-2.5 pr-2 text-right font-mono text-sm font-semibold tabular-nums">
              {formatUSD(totalClaimValue(claim))}
            </td>
            <td className="w-8 py-2.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
