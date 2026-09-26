-- ============================================================
-- Maqbool — Database Schema (PostgreSQL / Neon)
-- Run this ONCE in the Neon SQL Editor.
-- ============================================================

DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS fit_analyses CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ---------- 1. PROFILE : the candidate (parsed CV) ----------
CREATE TABLE profiles (
  id             SERIAL PRIMARY KEY,
  full_name      TEXT NOT NULL,
  headline       TEXT,
  email          TEXT,
  phone          TEXT,
  location       TEXT,
  linkedin       TEXT,
  github         TEXT,
  summary        TEXT,
  skills         JSONB DEFAULT '[]'::jsonb,
  education      JSONB DEFAULT '[]'::jsonb,
  experience     JSONB DEFAULT '[]'::jsonb,
  projects       JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  languages      JSONB DEFAULT '[]'::jsonb,
  raw_cv_text    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 2. JOBS : scouted from live APIs or pasted ----------
CREATE TABLE jobs (
  id             SERIAL PRIMARY KEY,
  source         TEXT DEFAULT 'manual',      -- remotive | adzuna | jooble | manual
  external_id    TEXT,
  title          TEXT NOT NULL,
  company        TEXT NOT NULL,
  location       TEXT,
  employment_type TEXT,
  seniority      TEXT,
  url            TEXT,
  jd_text        TEXT,
  tags           JSONB DEFAULT '[]'::jsonb,
  posted_at      DATE,
  scouted_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, external_id)
);

-- ---------- 3. APPLICATIONS : the pipeline ----------
CREATE TABLE applications (
  id             SERIAL PRIMARY KEY,
  profile_id     INT REFERENCES profiles(id) ON DELETE CASCADE,
  job_id         INT REFERENCES jobs(id) ON DELETE SET NULL,
  company        TEXT NOT NULL,
  role           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Saved',
     -- Saved | Applied | Screening | Interview | Task | Offer | Rejected | Withdrawn
  priority       TEXT DEFAULT 'Medium',       -- Low | Medium | High
  applied_at     DATE,
  next_action    TEXT,
  next_action_at DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_app_status ON applications(status);
CREATE INDEX idx_app_company ON applications(lower(company));

-- ---------- 4. FIT ANALYSES : Fit Agent output ----------
CREATE TABLE fit_analyses (
  id               SERIAL PRIMARY KEY,
  application_id   INT REFERENCES applications(id) ON DELETE CASCADE,
  match_score      INT CHECK (match_score BETWEEN 0 AND 100),
  verdict          TEXT,                     -- Strong Fit | Possible Fit | Stretch | Not A Fit
  matching_skills  JSONB DEFAULT '[]'::jsonb,
  missing_skills   JSONB DEFAULT '[]'::jsonb,
  evidence         JSONB DEFAULT '[]'::jsonb, -- which CV items proved which requirement
  gap_plan         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 5. DOCUMENTS : cover letters / tailored bullets ----------
CREATE TABLE documents (
  id             SERIAL PRIMARY KEY,
  application_id INT REFERENCES applications(id) ON DELETE CASCADE,
  doc_type       TEXT NOT NULL,             -- cover_letter | cv_bullets | outreach_dm | followup_email
  language       TEXT DEFAULT 'en',         -- en | ar
  content        TEXT NOT NULL,
  approved       BOOLEAN DEFAULT FALSE,     -- human-in-the-loop gate
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 6. INTERVIEW SESSIONS : Coach Agent ----------
CREATE TABLE interview_sessions (
  id             SERIAL PRIMARY KEY,
  application_id INT REFERENCES applications(id) ON DELETE CASCADE,
  round_type     TEXT DEFAULT 'technical',  -- hr | technical | behavioral
  transcript     JSONB DEFAULT '[]'::jsonb, -- [{q, a, score, feedback}]
  overall_score  INT,
  strengths      TEXT,
  improvements   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- 7. ACTIVITY LOG : audit trail of every agent action ----------
CREATE TABLE activity_log (
  id             SERIAL PRIMARY KEY,
  application_id INT REFERENCES applications(id) ON DELETE CASCADE,
  agent          TEXT NOT NULL,             -- which agent acted
  action         TEXT NOT NULL,
  detail         TEXT,
  success        BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- Convenience view for the dashboard ----------
CREATE OR REPLACE VIEW v_pipeline AS
SELECT a.id, a.company, a.role, a.status, a.priority,
       a.applied_at, a.next_action, a.next_action_at,
       f.match_score, f.verdict,
       j.url AS job_url, j.source
FROM applications a
LEFT JOIN LATERAL (
  SELECT * FROM fit_analyses fa WHERE fa.application_id = a.id
  ORDER BY fa.created_at DESC LIMIT 1
) f ON TRUE
LEFT JOIN jobs j ON j.id = a.job_id
ORDER BY a.updated_at DESC;
