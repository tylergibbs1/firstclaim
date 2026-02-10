import type { ClaimData, ClaimLineItem, Finding } from "./types";

/**
 * CY 2024 Medicare Physician Fee Schedule — national averages.
 * Source: cms.gov/medicare/payment/fee-schedules
 */
const MEDICARE_FEE_SCHEDULE: Record<string, number> = {
  "99213": 92,
  "99214": 131,
  "72070": 31,
  "73562": 33,
  "11102": 107,
  "11103": 63,
  "11200": 78,
  "20610": 72,
  "77067": 150,
};

/** Per-unit fee for a CPT code. Returns 0 if unknown. */
export function getFee(cpt: string): number {
  return MEDICARE_FEE_SCHEDULE[cpt] ?? 0;
}

/** Fee × units for a single line item. */
export function lineItemFee(item: ClaimLineItem): number {
  return getFee(item.cpt) * item.units;
}

/** Sum of all line item fees on a claim. */
export function totalClaimValue(claim: ClaimData): number {
  return claim.lineItems.reduce((sum, item) => sum + lineItemFee(item), 0);
}

/** Sum of fees for line items that have unresolved findings. */
export function revenueAtRisk(claim: ClaimData): number {
  const flaggedLines = new Set(
    claim.findings
      .filter((f) => !f.resolved && f.relatedLineNumber != null)
      .map((f) => f.relatedLineNumber)
  );
  return claim.lineItems
    .filter((item) => flaggedLines.has(item.lineNumber))
    .reduce((sum, item) => sum + lineItemFee(item), 0);
}

/** Dollar impact of a single finding (fee × units for its related line). */
export function findingRevenueImpact(
  finding: Finding,
  lineItems: ClaimLineItem[]
): number {
  if (finding.relatedLineNumber == null) return 0;
  const item = lineItems.find(
    (li) => li.lineNumber === finding.relatedLineNumber
  );
  return item ? lineItemFee(item) : 0;
}

const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format a number as whole-dollar USD, e.g. "$267". */
export function formatUSD(amount: number): string {
  return usdFormat.format(amount);
}
