import 'dotenv/config';
import { q, pool } from './db.js';
import { isConfigured } from './micromind.js';

const ok = (s) => console.log(`  ✅ ${s}`);
const bad = (s) => console.log(`  ❌ ${s}`);

console.log('\nMaqbool — health check\n');

try {
  const rows = await q(`SELECT table_name FROM information_schema.tables
                        WHERE table_schema='public' ORDER BY 1`);
  const names = rows.map(r => r.table_name);
  const expected = ['activity_log','applications','documents','fit_analyses',
                    'interview_sessions','jobs','profiles','v_pipeline'];
  const missing = expected.filter(t => !names.includes(t));
  missing.length ? bad(`DB missing tables: ${missing.join(', ')}`)
                 : ok(`DB connected — all ${expected.length} objects present`);
} catch (e) {
  bad(`DB: ${e.message}`);
}

isConfigured()
  ? ok('MicroMind URL configured')
  : bad('MicroMind URL not set yet (server/.env → MICROMIND_API_URL)');

try {
  const r = await fetch('https://remotive.com/api/remote-jobs?search=AI&limit=1');
  const d = await r.json();
  d?.jobs?.length ? ok(`Jobs API reachable (${d['job-count'] ?? '?'} total jobs)`)
                  : bad('Jobs API returned no jobs');
} catch (e) {
  bad(`Jobs API: ${e.message}`);
}

console.log('');
await pool.end();
