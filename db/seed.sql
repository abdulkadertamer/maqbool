-- ============================================================
-- Maqbool — Seed data
-- Real target companies, so the dashboard and agents have
-- something meaningful to work against from a cold start.
-- Run AFTER schema.sql.
-- ============================================================

INSERT INTO applications (profile_id, company, role, status, priority, applied_at, next_action, next_action_at, notes)
VALUES
  (1, 'Vodafone',        'Data Analyst Intern',        'Interview', 'High',   CURRENT_DATE - 12, 'Prepare for technical round',  CURRENT_DATE + 3, 'Referred through university career fair'),
  (1, 'Jumia',           'Data Scientist Intern',      'Applied',   'High',   CURRENT_DATE - 8,  'Follow up with recruiter',     CURRENT_DATE + 2, NULL),
  (1, 'Fawry',           'AI Engineer Intern',         'Screening', 'High',   CURRENT_DATE - 6,  'HR screening call',            CURRENT_DATE + 1, NULL),
  (1, 'Orange Egypt',    'Technology Intern',          'Applied',   'Medium', CURRENT_DATE - 15, NULL,                           NULL,             NULL),
  (1, 'Thndr',           'Machine Learning Intern',    'Rejected',  'Medium', CURRENT_DATE - 21, NULL,                           NULL,             'No open intern headcount this cycle'),
  (1, 'Hikma Pharma',    'Data Analyst Intern',        'Saved',     'Low',    NULL,              'Submit application',           CURRENT_DATE + 5, NULL),
  (1, 'Pixelogic Media', 'AI/ML Intern',               'Applied',   'Medium', CURRENT_DATE - 4,  NULL,                           NULL,             NULL);

INSERT INTO fit_analyses (application_id, match_score, verdict, matching_skills, missing_skills, gap_plan)
VALUES
  (1, 82, 'Strong Fit',   '["Python","Pandas","Data Analysis","Excel"]'::jsonb, '["Power BI"]'::jsonb,            'Complete a short Power BI project and add it to the portfolio.'),
  (2, 76, 'Possible Fit', '["Python","Scikit-Learn","Machine Learning"]'::jsonb, '["SQL","A/B testing"]'::jsonb,  'Run through an SQL practice track; write up one A/B test case study.'),
  (3, 71, 'Possible Fit', '["Machine Learning","TensorFlow","Computer Vision"]'::jsonb, '["MLOps","Docker"]'::jsonb, 'Containerise the Heart Failure Detection project and document the deployment.'),
  (5, 44, 'Stretch',      '["Python","Machine Learning"]'::jsonb, '["Finance domain","Time series"]'::jsonb,      'Build one time-series forecasting project on market data before reapplying.');

INSERT INTO activity_log (application_id, agent, action, detail)
VALUES
  (1, 'tracker', 'created',       'Vodafone — Data Analyst Intern'),
  (1, 'fit',     'analysed',      'score 82'),
  (1, 'writer',  'drafted',       'cover_letter'),
  (1, 'tracker', 'status_change', '→ Interview'),
  (2, 'tracker', 'created',       'Jumia — Data Scientist Intern'),
  (2, 'fit',     'analysed',      'score 76'),
  (3, 'scout',   'found',         'Fawry — AI Engineer Intern via job search'),
  (3, 'fit',     'analysed',      'score 71'),
  (5, 'fit',     'analysed',      'score 44'),
  (5, 'tracker', 'status_change', '→ Rejected');
