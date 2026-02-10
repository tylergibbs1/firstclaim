/**
 * One-time ICD-10-CM import script.
 * Parses data/icd10cm-descriptions/icd10cm-order-2026.txt (fixed-width)
 * and batch-upserts into Supabase.
 *
 * Usage: bun run scripts/import-icd10.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = resolve(
  import.meta.dirname,
  "../data/icd10cm-descriptions/icd10cm-order-2026.txt"
);

interface ICD10Row {
  code: string;
  short_desc: string;
  long_desc: string;
  billable: boolean;
}

function parseLine(line: string): ICD10Row | null {
  if (line.length < 78) return null;

  // Fixed-width: ORDER(5) SPACE CODE(7) SPACE BILLABLE(1) SPACE SHORT_DESC(60) SPACE LONG_DESC(rest)
  const code = line.substring(6, 13).trim();
  const billableFlag = line.substring(14, 15);
  const shortDesc = line.substring(16, 77).trim();
  const longDesc = line.substring(77).trim();

  if (!code || !shortDesc) return null;

  return {
    code,
    short_desc: shortDesc,
    long_desc: longDesc || shortDesc,
    billable: billableFlag === "1",
  };
}

async function main() {
  console.log(`Reading ${FILE_PATH}...`);
  const raw = readFileSync(FILE_PATH, "utf-8");
  const lines = raw.split("\n").filter(Boolean);
  console.log(`Parsed ${lines.length} lines`);

  const rows: ICD10Row[] = [];
  for (const line of lines) {
    const row = parseLine(line);
    if (row) rows.push(row);
  }
  console.log(`Valid rows: ${rows.length}`);

  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("icd10").upsert(batch, {
      onConflict: "code",
    });
    if (error) {
      console.error(`Error at batch ${i}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r  Imported ${inserted}/${rows.length}`);
  }

  console.log("\nDone!");

  // Verify
  const { count } = await supabase
    .from("icd10")
    .select("*", { count: "exact", head: true });
  console.log(`Total rows in icd10 table: ${count}`);

  const { data } = await supabase
    .from("icd10")
    .select("code, code_dot, short_desc, billable")
    .eq("code", "M5431")
    .single();
  console.log("Verification (M5431):", data);
}

main().catch(console.error);
