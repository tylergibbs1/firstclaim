/**
 * Create Supabase tables for FirstClaim.
 * Usage: bun run scripts/create-tables.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SQL = `
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ICD-10-CM codes with full-text search
CREATE TABLE IF NOT EXISTS public.icd10 (
  code       TEXT PRIMARY KEY,
  code_dot   TEXT GENERATED ALWAYS AS (
    CASE WHEN length(code) <= 3 THEN code
         ELSE left(code, 3) || '.' || substring(code FROM 4) END
  ) STORED,
  short_desc TEXT NOT NULL,
  long_desc  TEXT NOT NULL,
  billable   BOOLEAN NOT NULL DEFAULT TRUE,
  fts        TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', code), 'A') ||
    setweight(to_tsvector('english', CASE WHEN length(code) <= 3 THEN code ELSE left(code, 3) || '.' || substring(code FROM 4) END), 'A') ||
    setweight(to_tsvector('english', long_desc), 'B')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_icd10_fts ON public.icd10 USING GIN (fts);
CREATE INDEX IF NOT EXISTS idx_icd10_trgm ON public.icd10 USING GIN (long_desc gin_trgm_ops);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  clinical_notes  TEXT NOT NULL,
  claim           JSONB,
  highlights      JSONB,
  agent_session_id TEXT,
  status          TEXT DEFAULT 'active'
);
`;

async function main() {
  console.log("Creating tables...");

  // Split and execute each statement
  const statements = SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    console.log(`  Executing: ${stmt.substring(0, 60)}...`);
    const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
    if (error) {
      // Try with .sql() if rpc fails
      console.log(`  RPC failed (${error.message}), this is expected - run SQL directly in Supabase Dashboard`);
    }
  }

  // Verify tables exist by querying them
  const { error: icd10Err } = await supabase
    .from("icd10")
    .select("code")
    .limit(1);

  if (icd10Err) {
    console.log("\nicd10 table not found. Please run the SQL in scripts/create-tables.sql directly in the Supabase SQL Editor.");
    console.log("Dashboard: https://supabase.com/dashboard/project/geskjpptuovivkbiqvrw/sql/new");
  } else {
    console.log("\nicd10 table exists!");
  }

  const { error: sessErr } = await supabase
    .from("sessions")
    .select("id")
    .limit(1);

  if (sessErr) {
    console.log("sessions table not found. Please run the SQL in scripts/create-tables.sql directly in the Supabase SQL Editor.");
  } else {
    console.log("sessions table exists!");
  }
}

main().catch(console.error);
