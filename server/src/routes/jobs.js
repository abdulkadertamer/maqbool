import { Router } from 'express';
import { q, one } from '../lib/db.js';

const r = Router();

const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

// GET /api/jobs/search?keyword=AI&location=  -> live listings (Remotive, free)
r.get('/search', async (req, res, next) => {
  try {
    const keyword = (req.query.keyword ?? 'AI').toString();
    const limit = Math.min(Number(req.query.limit ?? 10), 20);

    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=${limit}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`Remotive ${resp.status}`);
    const data = await resp.json();

    const jobs = (data.jobs ?? []).map((j) => ({
      external_id: String(j.id),
      source: 'remotive',
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location,
      employment_type: j.job_type,
      url: j.url,
      posted_at: j.publication_date?.slice(0, 10) ?? null,
      tags: j.tags ?? [],
      jd_excerpt: stripHtml(j.description).slice(0, 600),
      jd_text: stripHtml(j.description),
    }));

    res.json({ query_used: keyword, count: jobs.length, jobs });
  } catch (e) { next(e); }
});

// GET /api/jobs  -> jobs already saved locally
r.get('/', async (_req, res, next) => {
  try {
    res.json(await q(`SELECT * FROM jobs ORDER BY scouted_at DESC LIMIT 100`));
  } catch (e) { next(e); }
});

// POST /api/jobs  -> save one job (idempotent on source+external_id)
r.post('/', async (req, res, next) => {
  try {
    const j = req.body;
    if (!j.title || !j.company) {
      return res.status(400).json({ error: 'title and company are required' });
    }
    const row = await one(
      `INSERT INTO jobs (source, external_id, title, company, location,
                         employment_type, seniority, url, jd_text, tags, posted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (source, external_id) DO UPDATE SET jd_text = EXCLUDED.jd_text
       RETURNING *`,
      [j.source ?? 'manual', j.external_id ?? null, j.title, j.company, j.location ?? null,
       j.employment_type ?? null, j.seniority ?? null, j.url ?? null,
       j.jd_text ?? j.jd_excerpt ?? null, JSON.stringify(j.tags ?? []), j.posted_at || null]
    );
    res.json(row);
  } catch (e) { next(e); }
});

export default r;
