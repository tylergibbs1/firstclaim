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
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_icd10_trgm ON public.icd10 USING GIN (long_desc gin_trgm_ops);

-- Disable RLS on icd10 (read-only reference data)
ALTER TABLE public.icd10 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.icd10 FOR SELECT USING (true);
CREATE POLICY "Allow service role insert" ON public.icd10 FOR INSERT WITH CHECK (true);

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

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
