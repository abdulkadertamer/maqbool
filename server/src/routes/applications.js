import { Router } from 'express';
import { q, one, logActivity } from '../lib/db.js';
import { askJSON } from '../lib/micromind.js';

const r = Router();

const STATUSES = ['Saved','Applied','Screening','Interview','Task','Offer','Rejected','Withdrawn'];

// GET /api/applications  -> the pipeline board
r.get('/', async (_req, res, next) => {
  try { res.json(await q(`SELECT * FROM v_pipeline`)); }
  catch (e) { next(e); }
});

// GET /api/applications/:id  -> one application, fully expanded
r.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const app = await one(`SELECT * FROM applications WHERE id=$1`, [id]);
    if (!app) return res.status(404).json({ error: 'Not found' });
    const [fit, docs, interviews, log] = await Promise.all([
      one(`SELECT * FROM fit_analyses WHERE application_id=$1 ORDER BY created_at DESC LIMIT 1`, [id]),
      q(`SELECT * FROM documents WHERE application_id=$1 ORDER BY created_at DESC`, [id]),
      q(`SELECT * FROM interview_sessions WHERE application_id=$1 ORDER BY created_at DESC`, [id]),
      q(`SELECT * FROM activity_log WHERE application_id=$1 ORDER BY created_at DESC LIMIT 25`, [id]),
    ]);
    res.json({ ...app, fit, documents: docs, interviews, activity: log });
  } catch (e) { next(e); }
});

// POST /api/applications  -> add to pipeline
r.post('/', async (req, res, next) => {
  try {
    const { company, role, job_id, priority, status, notes } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'company and role are required' });

    const profile = await one(`SELECT id FROM profiles ORDER BY id DESC LIMIT 1`);
    const row = await one(
      `INSERT INTO applications (profile_id, job_id, company, role, status, priority, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [profile?.id ?? null, job_id ?? null, company, role,
       STATUSES.includes(status) ? status : 'Saved', priority ?? 'Medium', notes ?? null]
    );
    await logActivity(row.id, 'tracker', 'created', `${company} — ${role}`);
    res.json(row);
  } catch (e) { next(e); }
});

// PATCH /api/applications/:id  -> status / next action / notes
r.patch('/:id', async (req, res, next) => {
  try {
    const { status, priority, next_action, next_action_at, notes } = req.body;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
    }
    const row = await one(
      `UPDATE applications SET
         status         = COALESCE($2, status),
         priority       = COALESCE($3, priority),
         next_action    = COALESCE($4, next_action),
         next_action_at = COALESCE($5, next_action_at),
         notes          = COALESCE($6, notes),
         applied_at     = CASE WHEN $2 = 'Applied' AND applied_at IS NULL
                               THEN CURRENT_DATE ELSE applied_at END,
         updated_at     = NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, status ?? null, priority ?? null, next_action ?? null,
       next_action_at || null, notes ?? null]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (status) await logActivity(row.id, 'tracker', 'status_change', `→ ${status}`);
    res.json(row);
  } catch (e) { next(e); }
});

// POST /api/applications/:id/fit   { jd_text }  -> Fit Agent
r.post('/:id/fit', async (req, res, next) => {
  try {
    const id = req.params.id;
    const app = await one(`SELECT * FROM applications WHERE id=$1`, [id]);
    if (!app) return res.status(404).json({ error: 'Not found' });

    const profile = await one(`SELECT * FROM profiles ORDER BY id DESC LIMIT 1`);
    if (!profile) return res.status(400).json({ error: 'No profile yet — parse a CV first' });

    const jd = req.body.jd_text
      ?? (await one(`SELECT jd_text FROM jobs WHERE id=$1`, [app.job_id]))?.jd_text;
    if (!jd) return res.status(400).json({ error: 'No job description available' });

    const { data } = await askJSON(
      `Run a fit analysis.\n\nCANDIDATE PROFILE JSON:\n${JSON.stringify({
        full_name: profile.full_name, headline: profile.headline, summary: profile.summary,
        skills: profile.skills, education: profile.education, experience: profile.experience,
        projects: profile.projects, certifications: profile.certifications,
      })}\n\nJOB DESCRIPTION:\n${jd}`
    );

    const row = await one(
      `INSERT INTO fit_analyses
        (application_id, match_score, verdict, matching_skills, missing_skills, evidence, gap_plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, data.match_score ?? null, data.verdict ?? null,
       JSON.stringify(data.matching_skills ?? []), JSON.stringify(data.missing_skills ?? []),
       JSON.stringify(data.evidence ?? []), data.gap_plan ?? null]
    );
    await logActivity(id, 'fit', 'analysed', `score ${data.match_score}`);
    res.json({ ...row, honest_note: data.honest_note ?? null });
  } catch (e) { next(e); }
});

// POST /api/applications/:id/document  { doc_type, language }  -> Writer Agent
r.post('/:id/document', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { doc_type = 'cover_letter', language = 'en' } = req.body;

    const app = await one(`SELECT * FROM applications WHERE id=$1`, [id]);
    if (!app) return res.status(404).json({ error: 'Not found' });

    const profile = await one(`SELECT * FROM profiles ORDER BY id DESC LIMIT 1`);
    const fit = await one(
      `SELECT * FROM fit_analyses WHERE application_id=$1 ORDER BY created_at DESC LIMIT 1`, [id]);
    const jd = req.body.jd_text
      ?? (await one(`SELECT jd_text FROM jobs WHERE id=$1`, [app.job_id]))?.jd_text ?? '';

    const { data } = await askJSON(
      `Write a ${doc_type} in language "${language}".\n\n` +
      `COMPANY: ${app.company}\nROLE: ${app.role}\n\n` +
      `CANDIDATE PROFILE JSON:\n${JSON.stringify({
        full_name: profile?.full_name, summary: profile?.summary, skills: profile?.skills,
        projects: profile?.projects, experience: profile?.experience,
      })}\n\n` +
      `FIT ANALYSIS:\n${JSON.stringify(fit ?? {})}\n\nJOB DESCRIPTION:\n${jd}`
    );

    const row = await one(
      `INSERT INTO documents (application_id, doc_type, language, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, doc_type, language, data.content ?? '']
    );
    await logActivity(id, 'writer', 'drafted', doc_type);
    res.json(row);
  } catch (e) { next(e); }
});

// PATCH /api/documents/:docId/approve  -> human-in-the-loop gate
r.patch('/documents/:docId/approve', async (req, res, next) => {
  try {
    const row = await one(
      `UPDATE documents SET approved=TRUE WHERE id=$1 RETURNING *`, [req.params.docId]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await logActivity(row.application_id, 'human', 'approved_document', row.doc_type);
    res.json(row);
  } catch (e) { next(e); }
});

export default r;

// POST /api/applications/:id/fit/save  -> save an already-computed fit analysis
// (used when the Master Agent itself does the reasoning, no second LLM call)
r.post('/:id/fit/save', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { match_score, verdict, matching_skills, missing_skills, evidence, gap_plan } = req.body;
    const row = await one(
      `INSERT INTO fit_analyses
        (application_id, match_score, verdict, matching_skills, missing_skills, evidence, gap_plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, match_score ?? null, verdict ?? null,
       JSON.stringify(matching_skills ?? []), JSON.stringify(missing_skills ?? []),
       JSON.stringify(evidence ?? []), gap_plan ?? null]
    );
    await logActivity(id, 'master', 'fit_saved', `score ${match_score}`);
    res.json(row);
  } catch (e) { next(e); }
});

// POST /api/applications/:id/document/save -> save an already-written document
r.post('/:id/document/save', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { doc_type = 'cover_letter', language = 'en', content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
    const row = await one(
      `INSERT INTO documents (application_id, doc_type, language, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, doc_type, language, content]
    );
    await logActivity(id, 'master', 'document_saved', doc_type);
    res.json(row);
  } catch (e) { next(e); }
});
