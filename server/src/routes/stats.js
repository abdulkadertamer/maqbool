import { Router } from 'express';
import { q, one } from '../lib/db.js';

const r = Router();

// GET /api/stats  -> dashboard numbers
r.get('/', async (_req, res, next) => {
  try {
    const [byStatus, funnel, avgScore, dueSoon, recent] = await Promise.all([
      q(`SELECT status, COUNT(*)::int AS count FROM applications
         GROUP BY status ORDER BY 2 DESC`),
      one(`SELECT
             COUNT(*)::int                                                     AS total,
             COUNT(*) FILTER (WHERE status <> 'Saved')::int                    AS applied,
             COUNT(*) FILTER (WHERE status IN ('Interview','Task','Offer'))::int AS interviews,
             COUNT(*) FILTER (WHERE status = 'Offer')::int                     AS offers,
             COUNT(*) FILTER (WHERE status = 'Rejected')::int                  AS rejected
           FROM applications`),
      one(`SELECT ROUND(AVG(match_score))::int AS avg_score FROM fit_analyses`),
      q(`SELECT id, company, role, next_action, next_action_at
         FROM applications
         WHERE next_action_at IS NOT NULL
           AND next_action_at <= CURRENT_DATE + 7
           AND status NOT IN ('Rejected','Withdrawn')
         ORDER BY next_action_at LIMIT 10`),
      q(`SELECT a.agent, a.action, a.detail, a.created_at, ap.company
         FROM activity_log a LEFT JOIN applications ap ON ap.id = a.application_id
         ORDER BY a.created_at DESC LIMIT 15`),
    ]);

    const interviewRate = funnel.applied
      ? Math.round((funnel.interviews / funnel.applied) * 100) : 0;

    res.json({ byStatus, funnel: { ...funnel, interviewRate },
               avgScore: avgScore?.avg_score ?? null, dueSoon, recent });
  } catch (e) { next(e); }
});

export default r;
