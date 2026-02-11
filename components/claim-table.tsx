"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useClaim, useDispatch } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ExternalLink, Copy, Check } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "motion/react";
import type { ClaimLineItem } from "@/lib/types";
import { lineItemFee, totalClaimValue, formatUSD } from "@/lib/fee-schedule";

const SPRING_TRANSITION = { type: "spring" as const, stiffness: 350, damping: 30, mass: 1 };
const INSTANT_TRANSITION = { duration: 0 };

type DiffStatus = "added" | "modified" | undefined;

function computeDiffs(
  current: ClaimLineItem[],
  previous: ClaimLineItem[] | undefined
): Map<number, "added" | "modified"> {
  if (!previous) return new Map();
  const prevByLine = new Map(previous.map((li) => [li.lineNumber, li]));
  const diffs = new Map<number, "added" | "modified">();
  for (const li of current) {
    const prev = prevByLine.get(li.lineNumber);
    if (!prev) {
      diffs.set(li.lineNumber, "added");
    } else if (
      li.cpt !== prev.cpt ||
      li.units !== prev.units ||
      li.description !== prev.description ||
      JSON.stringify(li.modifiers) !== JSON.stringify(prev.modifiers) ||
      JSON.stringify(li.icd10) !== JSON.stringify(prev.icd10)
    ) {
      diffs.set(li.lineNumber, "modified");
    }
  }
  return diffs;
}

const diffStyles: Record<string, string> = {
  added: "bg-success/8 border-l-[3px] border-l-success",
  modified: "bg-warning/8 border-l-[3px] border-l-warning",
};

const LineItemRow = memo(function LineItemRow({
  item,
  hasActiveFinding,
  showQty,
  diffStatus,
}: {
  item: ClaimLineItem;
  hasActiveFinding: boolean;
  showQty: boolean;
  diffStatus?: DiffStatus;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const diffClass = diffStatus ? diffStyles[diffStatus] : "";

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const cptStr = item.modifiers.length > 0
      ? `${item.cpt}-${item.modifiers.join(",")}`
      : item.cpt;
    const text = `${cptStr} · ${item.icd10.join(", ")}${item.units > 1 ? ` · ${item.units} units` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        tabIndex={0}
        aria-expanded={expanded}
        className={`group cursor-pointer border-b border-border/30 transition-all duration-700 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          diffClass || (hasActiveFinding ? "border-l-[3px] border-l-primary" : "")
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
            null
          )}
        </td>
        <td className="w-40 py-3 pr-3">
          <div className="flex gap-1">
            {item.icd10.slice(0, 2).map((code) => (
              <span
                key={code}
                className="inline-flex rounded-md border border-tertiary/20 bg-tertiary/8 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground/80"
              >
                {code}
              </span>
            ))}
            {item.icd10.length > 2 && (
              <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                +{item.icd10.length - 2}
              </span>
            )}
          </div>
        </td>
        {showQty && (
          <td className="w-12 py-3 pr-2 text-center font-mono text-sm tabular-nums">
            {item.units}
          </td>
        )}
        <td
          className={`w-16 py-3 pr-2 text-right font-mono text-sm tabular-nums ${
            hasActiveFinding
              ? "font-bold text-destructive"
              : lineItemFee(item) === 0
                ? "text-muted-foreground/30"
                : "text-muted-foreground"
          }`}
        >
          {lineItemFee(item) === 0 ? (
            <span className="font-sans text-[10px] text-muted-foreground/40">N/A</span>
          ) : formatUSD(lineItemFee(item))}
        </td>
        <td className="w-16 py-3 pr-2">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={handleCopy}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50 hover:!text-foreground hover:!bg-muted"
              aria-label="Copy line item"
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
            <div className="flex h-6 w-6 items-center justify-center text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan={showQty ? 8 : 7} className="p-0">
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="border-b border-border/20 bg-muted/20 px-6 py-3.5">
                {item.icd10.length > 2 && (
                  <div className="mb-2.5 flex flex-wrap gap-1">
                    {item.icd10.map((code) => (
                      <span
                        key={code}
                        className="inline-flex rounded-md border border-tertiary/20 bg-tertiary/8 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground/80"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {item.codingRationale}
                </p>
                {item.sources?.length > 0 && (
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
            </div>
          </div>
        </td>
      </tr>
    </>
  );
});

export function ClaimTable() {
  const { claim, previousClaim } = useClaim();
  const dispatch = useDispatch();
  const reducedMotion = useReducedMotion();

  const diffs = useMemo(
    () => computeDiffs(claim?.lineItems ?? [], previousClaim?.lineItems),
    [claim?.lineItems, previousClaim?.lineItems]
  );

  // Auto-clear highlights after 5 seconds
  useEffect(() => {
    if (!previousClaim) return;
    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_PREVIOUS_CLAIM" });
    }, 5000);
    return () => clearTimeout(timer);
  }, [previousClaim, dispatch]);

  if (!claim) return null;

  const findingLines = new Set(
    claim.findings
      .filter((f) => !f.resolved && f.relatedLineNumber)
      .map((f) => f.relatedLineNumber)
  );

  const showQty = claim.lineItems.some((item) => item.units > 1);

  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-xl border border-border/50 bg-card">
      <table className="w-full text-left" aria-label="Claim line items">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="w-10 py-2.5 pl-4 pr-2 text-right text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              #
            </th>
            <th className="w-24 py-2.5 pr-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              CPT
            </th>
            <th className="py-2.5 pr-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Description
            </th>
            <th className="w-20 py-2.5 pr-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Modifiers
            </th>
            <th className="w-40 py-2.5 pr-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Diagnosis
            </th>
            {showQty && (
              <th className="w-12 py-2.5 pr-2 text-center text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                Qty
              </th>
            )}
            <th className="w-16 py-2.5 pr-2 text-right text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Fee
            </th>
            <th className="w-16 py-2.5" />
          </tr>
        </thead>
        <LayoutGroup>
          <AnimatePresence mode="popLayout" initial={false}>
            {claim.lineItems.map((item) => (
              <motion.tbody
                key={`${item.lineNumber}-${item.cpt}`}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={reducedMotion ? INSTANT_TRANSITION : SPRING_TRANSITION}
              >
                <LineItemRow
                  item={item}
                  hasActiveFinding={findingLines.has(item.lineNumber)}
                  showQty={showQty}
                  diffStatus={diffs.get(item.lineNumber)}
                />
              </motion.tbody>
            ))}
          </AnimatePresence>
        </LayoutGroup>
        <tfoot>
          <tr className="border-t border-border/40 bg-muted/30">
            <td colSpan={showQty ? 6 : 5} className="py-2.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total
            </td>
            <td className="w-16 py-2.5 pr-2 text-right font-mono text-sm font-semibold tabular-nums">
              {formatUSD(totalClaimValue(claim))}
            </td>
            <td className="w-16 py-2.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
