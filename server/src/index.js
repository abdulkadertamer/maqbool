import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import profile from './routes/profile.js';
import jobs from './routes/jobs.js';
import applications from './routes/applications.js';
import chat from './routes/chat.js';
import stats from './routes/stats.js';
import { isConfigured } from './lib/micromind.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'maqbool', agentConnected: isConfigured() }));

app.use('/api/profile', profile);
app.use('/api/jobs', jobs);
app.use('/api/applications', applications);
app.use('/api/chat', chat);
app.use('/api/stats', stats);

// central error handler — never leak a stack trace to the browser
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  const status = err.code === 'NOT_CONFIGURED' ? 503 : 500;
  res.status(status).json({ error: err.message, received: err.received });
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`\n  Maqbool API  →  http://localhost:${PORT}`);
  console.log(`  Master Agent →  ${isConfigured() ? 'connected' : 'NOT SET (see server/.env)'}\n`);
});
