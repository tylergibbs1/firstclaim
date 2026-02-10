import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import type { ClaimData, NoteHighlight } from "@/lib/types";

export interface ClaimState {
  claim: ClaimData | null;
  highlights: NoteHighlight[];
  suggestedPrompts: string[];
  onClaimUpdate: (claim: ClaimData) => void;
  onHighlightsUpdate: (highlights: NoteHighlight[]) => void;
  onToolResult?: (tool: string, result: string) => void;
}

export function makeTools(state: ClaimState) {
  const searchIcd10 = tool(
    "search_icd10",
    "Full-text search ICD-10-CM codes by keyword or phrase. Returns up to 10 matching codes with descriptions and billable status. Use this to find appropriate diagnosis codes from clinical documentation.",
    {
      query: z.string().describe("Search query — a diagnosis, symptom, or condition name"),
      billable_only: z.boolean().optional().describe("If true, only return billable codes (default: true)"),
    },
    async (args) => {
      const billableOnly = args.billable_only !== false;

      // Try full-text search first
      let query = supabase
        .from("icd10")
        .select("code, code_dot, short_desc, long_desc, billable")
        .textSearch("fts", args.query, { type: "websearch" })
        .limit(10);

      if (billableOnly) query = query.eq("billable", true);

      let { data, error } = await query;

      // Fallback to trigram similarity if FTS returns nothing
      if (!error && (!data || data.length === 0)) {
        const fallback = supabase
          .from("icd10")
          .select("code, code_dot, short_desc, long_desc, billable")
          .ilike("long_desc", `%${args.query}%`)
          .limit(10);

        if (billableOnly) {
          const result = await fallback.eq("billable", true);
          data = result.data;
          error = result.error;
        } else {
          const result = await fallback;
          data = result.data;
          error = result.error;
        }
      }

      if (error) {
        state.onToolResult?.("search_icd10", `Error: ${error.message}`);
        return { content: [{ type: "text" as const, text: `Error: ${error.message}` }], isError: true };
      }

      if (!data || data.length === 0) {
        const msg = `No ICD-10 codes found for "${args.query}"`;
        state.onToolResult?.("search_icd10", msg);
        return { content: [{ type: "text" as const, text: msg }] };
      }

      const results = data.map((r) => `${r.code_dot} — ${r.long_desc} [billable: ${r.billable}]`).join("\n");
      state.onToolResult?.("search_icd10", `${data.length} result${data.length === 1 ? "" : "s"}: ${data.map((r) => r.code_dot).join(", ")}`);
      return { content: [{ type: "text" as const, text: results }] };
    }
  );

  const lookupIcd10 = tool(
    "lookup_icd10",
    "Look up a specific ICD-10-CM code. Provide the code with or without a dot (e.g. 'M54.31' or 'M5431'). Returns the full description, billable status, and dotted form.",
    {
      code: z.string().describe("ICD-10-CM code, with or without dot"),
    },
    async (args) => {
      const normalized = args.code.replace(".", "").toUpperCase();

      const { data, error } = await supabase
        .from("icd10")
        .select("code, code_dot, short_desc, long_desc, billable")
        .eq("code", normalized)
        .single();

      if (error || !data) {
        const msg = `Code "${args.code}" not found in ICD-10-CM database.`;
        state.onToolResult?.("lookup_icd10", msg);
        return { content: [{ type: "text" as const, text: msg }] };
      }

      state.onToolResult?.("lookup_icd10", `${data.code_dot} — ${data.short_desc} [billable: ${data.billable}]`);
      return {
        content: [
          {
            type: "text" as const,
            text: `${data.code_dot} — ${data.long_desc}\nShort: ${data.short_desc}\nBillable: ${data.billable}`,
          },
        ],
      };
    }
  );

  const checkAgeSex = tool(
    "check_age_sex",
    "Validate an ICD-10 or CPT code against patient demographics. Checks for age/sex mismatches (e.g., pregnancy codes for male patients, pediatric codes for adults, mammography screening for males).",
    {
      code: z.string().describe("ICD-10 or CPT code to validate"),
      code_type: z.enum(["icd10", "cpt"]).describe("Whether this is an ICD-10 or CPT code"),
      patient_age: z.number().describe("Patient age in years"),
      patient_sex: z.enum(["M", "F"]).describe("Patient sex"),
    },
    async (args) => {
      const issues: string[] = [];
      const code = args.code.replace(".", "").toUpperCase();

      // Female-only ICD-10 codes
      if (args.code_type === "icd10" && args.patient_sex === "M") {
        if (code.startsWith("O")) issues.push("Pregnancy/childbirth codes (O-codes) are designated for female patients.");
        if (code.startsWith("N70") || code.startsWith("N71") || code.startsWith("N72") || code.startsWith("N73"))
          issues.push("Female pelvic inflammatory disease codes are designated for female patients.");
        if (code === "Z1231") issues.push("Z12.31 (encounter for screening mammogram) is designated for female patients.");
      }

      // Male-only ICD-10 codes
      if (args.code_type === "icd10" && args.patient_sex === "F") {
        if (code.startsWith("N40") || code.startsWith("N41") || code.startsWith("N42"))
          issues.push("Prostate-related codes are designated for male patients.");
      }

      // CPT-level sex checks
      if (args.code_type === "cpt" && args.patient_sex === "M") {
        if (["77067", "77066", "77065"].includes(code))
          issues.push("Screening mammography CPT codes are designated for female patients. Will almost certainly be denied for a male patient.");
      }

      // Age checks
      if (args.patient_age < 18) {
        if (args.code_type === "cpt" && ["77067", "77066", "77065"].includes(code))
          issues.push("Screening mammography is not typically indicated for patients under 18.");
      }

      // Pediatric-only codes on adults
      if (args.patient_age >= 18 && args.code_type === "icd10") {
        if (code.startsWith("P")) issues.push("Perinatal condition codes (P-codes) are typically for newborns/infants.");
      }

      if (issues.length === 0) {
        const msg = `No age/sex issues found for ${args.code} (${args.patient_sex}, age ${args.patient_age}).`;
        state.onToolResult?.("check_age_sex", msg);
        return { content: [{ type: "text" as const, text: msg }] };
      }

      state.onToolResult?.("check_age_sex", `${issues.length} issue${issues.length === 1 ? "" : "s"} for ${args.code}`);
      return {
        content: [
          {
            type: "text" as const,
            text: `ISSUES for ${args.code} (${args.patient_sex}, age ${args.patient_age}):\n${issues.map((i) => `- ${i}`).join("\n")}`,
          },
        ],
      };
    }
  );

  const updateClaim = tool(
    "update_claim",
    `Update the current claim. This is the ONLY way to modify the claim. You can:
- Set the full claim object (use "set" action)
- Add or remove line items
- Add, update, or resolve findings
- Update the risk score
Always call this tool when you want to change any claim data.`,
    {
      action: z.enum(["set", "add_line_item", "remove_line_item", "update_line_item", "add_finding", "resolve_finding", "set_risk_score"]).describe("The mutation action"),
      claim: z.any().optional().describe("Full ClaimData object (for 'set' action)"),
      line_item: z.any().optional().describe("ClaimLineItem object (for add/update)"),
      line_number: z.number().optional().describe("Line number to remove or update"),
      finding: z.any().optional().describe("Finding object (for 'add_finding')"),
      finding_id: z.string().optional().describe("Finding ID (for 'resolve_finding')"),
      resolved_reason: z.string().optional().describe("Why the finding was resolved"),
      risk_score: z.number().optional().describe("New risk score 0-100 (for 'set_risk_score')"),
    },
    async (args) => {
      let claim = state.claim;

      switch (args.action) {
        case "set":
          if (!args.claim) return { content: [{ type: "text" as const, text: "Missing claim object for 'set' action" }], isError: true };
          claim = args.claim as ClaimData;
          break;

        case "add_line_item":
          if (!claim || !args.line_item) return { content: [{ type: "text" as const, text: "Missing claim or line_item" }], isError: true };
          claim = { ...claim, lineItems: [...claim.lineItems, args.line_item] };
          break;

        case "remove_line_item":
          if (!claim || args.line_number == null) return { content: [{ type: "text" as const, text: "Missing claim or line_number" }], isError: true };
          claim = { ...claim, lineItems: claim.lineItems.filter((li) => li.lineNumber !== args.line_number) };
          break;

        case "update_line_item":
          if (!claim || args.line_number == null || !args.line_item)
            return { content: [{ type: "text" as const, text: "Missing claim, line_number, or line_item" }], isError: true };
          claim = {
            ...claim,
            lineItems: claim.lineItems.map((li) => (li.lineNumber === args.line_number ? { ...li, ...args.line_item } : li)),
          };
          break;

        case "add_finding":
          if (!claim || !args.finding) return { content: [{ type: "text" as const, text: "Missing claim or finding" }], isError: true };
          claim = { ...claim, findings: [...claim.findings, args.finding] };
          break;

        case "resolve_finding":
          if (!claim || !args.finding_id) return { content: [{ type: "text" as const, text: "Missing claim or finding_id" }], isError: true };
          claim = {
            ...claim,
            findings: claim.findings.map((f) =>
              f.id === args.finding_id ? { ...f, resolved: true, resolvedReason: args.resolved_reason } : f
            ),
          };
          break;

        case "set_risk_score":
          if (!claim || args.risk_score == null) return { content: [{ type: "text" as const, text: "Missing claim or risk_score" }], isError: true };
          claim = { ...claim, riskScore: args.risk_score };
          break;
      }

      state.claim = claim;
      state.onClaimUpdate(claim!);

      const summary = `Claim updated (${args.action}). ${claim!.lineItems.length} line items, ${claim!.findings.length} findings, risk: ${claim!.riskScore}`;
      state.onToolResult?.("update_claim", summary);
      return {
        content: [
          {
            type: "text" as const,
            text: `Claim updated (${args.action}). Current state: ${claim!.lineItems.length} line items, ${claim!.findings.length} findings, risk score: ${claim!.riskScore}`,
          },
        ],
      };
    }
  );

  const addHighlights = tool(
    "add_highlights",
    "Map each extracted code back to the exact text span it came from in the clinical notes. Call this after coding (Stage 2) and before building the claim (Stage 3).",
    {
      highlights: z.array(
        z.object({
          id: z.string().describe("Unique ID, e.g. 'h1', 'h2'"),
          original_text: z.string().describe("Exact verbatim substring from the clinical notes"),
          code: z.string().describe("The extracted ICD-10 or CPT code"),
          type: z.enum(["icd10", "cpt"]).describe("Code type"),
          confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
          notes: z.string().describe("1-2 sentence rationale for this code"),
          alternatives: z.array(
            z.object({
              code: z.string(),
              description: z.string(),
            })
          ).describe("Other codes considered"),
        })
      ).describe("Array of code-to-text mappings"),
    },
    async (args) => {
      state.highlights = args.highlights;
      state.onHighlightsUpdate(args.highlights);

      const msg = `Stored ${args.highlights.length} highlight mappings.`;
      state.onToolResult?.("add_highlights", msg);
      return {
        content: [
          {
            type: "text" as const,
            text: msg,
          },
        ],
      };
    }
  );

  const suggestNextActions = tool(
    "suggest_next_actions",
    "Suggest 2-4 next actions the user might want to take. MUST be called as the final tool in every response. Each action should be a short imperative phrase that reads as a user command (e.g. 'Add modifier 25 to the E/M', 'Export the claim'). Never phrase as a question.",
    {
      actions: z.array(
        z.string().describe("Short imperative action phrase, e.g. 'Remove the mammography line item'")
      ).min(2).max(4).describe("2-4 suggested next actions"),
    },
    async (args) => {
      state.suggestedPrompts = args.actions;
      return {
        content: [{ type: "text" as const, text: `Suggested ${args.actions.length} next actions.` }],
      };
    }
  );

  return [searchIcd10, lookupIcd10, checkAgeSex, updateClaim, addHighlights, suggestNextActions];
}
