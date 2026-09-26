import { Router } from 'express';
import { q, one } from '../lib/db.js';
import { askJSON } from '../lib/micromind.js';

const r = Router();

// GET /api/profile  -> the current candidate profile
r.get('/', async (_req, res, next) => {
  try {
    const row = await one(`SELECT * FROM profiles ORDER BY id DESC LIMIT 1`);
    res.json(row);
  } catch (e) { next(e); }
});

// POST /api/profile/parse  { cv_text }  -> Profile Agent parses, we store
r.post('/parse', async (req, res, next) => {
  try {
    const { cv_text } = req.body;
    if (!cv_text?.trim()) return res.status(400).json({ error: 'cv_text is required' });

    const { data } = await askJSON(
      `Parse this CV into the profile JSON schema.\n\n---\n${cv_text}\n---`
    );

    const row = await one(
      `INSERT INTO profiles
        (full_name, headline, email, phone, location, linkedin, github, summary,
         skills, education, experience, projects, certifications, languages, raw_cv_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        data.full_name ?? '', data.headline ?? '', data.email ?? '', data.phone ?? '',
        data.location ?? '', data.linkedin ?? '', data.github ?? '', data.summary ?? '',
        JSON.stringify(data.skills ?? []), JSON.stringify(data.education ?? []),
        JSON.stringify(data.experience ?? []), JSON.stringify(data.projects ?? []),
        JSON.stringify(data.certifications ?? []), JSON.stringify(data.languages ?? []),
        cv_text,
      ]
    );
    res.json(row);
  } catch (e) { next(e); }
});

// PUT /api/profile/:id  -> manual edits from the dashboard
r.put('/:id', async (req, res, next) => {
  try {
    const f = req.body;
    const row = await one(
      `UPDATE profiles SET
         full_name=COALESCE($2,full_name), headline=COALESCE($3,headline),
         summary=COALESCE($4,summary), skills=COALESCE($5,skills),
         updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, f.full_name, f.headline, f.summary,
       f.skills ? JSON.stringify(f.skills) : null]
    );
    res.json(row);
  } catch (e) { next(e); }
});

export default r;
