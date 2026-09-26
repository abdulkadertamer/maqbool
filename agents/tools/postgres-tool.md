# TOOL: Postgres  (Database / Custom SQL node in MicroMind Core)

Attach this tool to the **Tracker Agent** only.

## Connection (Neon)
- Host:     `ep-xxxx.eu-central-1.aws.neon.tech`
- Database: `maqbool`
- User / Password: from your Neon dashboard
- SSL: **required**
- Full connection string format:
  `postgresql://USER:PASSWORD@HOST/maqbool?sslmode=require`

## Tool description to paste into the node
```
postgres_query — Runs SQL against the Maqbool application-tracking database.
Tables: profiles, jobs, applications, fit_analyses, documents,
interview_sessions, activity_log. Read-only view: v_pipeline.
Use for saving applications, updating status, and answering pipeline questions.
DELETE statements are forbidden.
```

## Ready-made queries the agent can lean on
```sql
-- pipeline overview
SELECT status, COUNT(*) FROM applications GROUP BY status ORDER BY 2 DESC;

-- where am I with one company
SELECT * FROM v_pipeline WHERE lower(company) LIKE lower('%vodafone%');

-- what needs action this week
SELECT company, role, status, next_action, next_action_at
FROM applications
WHERE next_action_at <= CURRENT_DATE + 7
ORDER BY next_action_at;

-- best scoring open applications
SELECT company, role, match_score, verdict FROM v_pipeline
WHERE status NOT IN ('Rejected','Withdrawn') AND match_score IS NOT NULL
ORDER BY match_score DESC LIMIT 10;

-- conversion funnel
SELECT
  COUNT(*) FILTER (WHERE status <> 'Saved')                AS applied,
  COUNT(*) FILTER (WHERE status IN ('Interview','Task','Offer')) AS reached_interview,
  COUNT(*) FILTER (WHERE status = 'Offer')                 AS offers
FROM applications;
```
