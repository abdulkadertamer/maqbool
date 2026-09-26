import { Router } from 'express';
import { ask, isConfigured } from '../lib/micromind.js';

const r = Router();

// POST /api/chat  { message, sessionId }  -> straight to the Master Agent
r.post('/', async (req, res, next) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        error: 'Master Agent not connected yet. Set MICROMIND_API_URL in server/.env.',
      });
    }
    const { message, sessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });

    const { answer, raw } = await ask(message, { sessionId });
    res.json({ answer, sessionId: sessionId ?? raw?.sessionId ?? null });
  } catch (e) { next(e); }
});

export default r;
