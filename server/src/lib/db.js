import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Neon's connection string carries its own sslmode/channel_binding query
// params, which collide with an explicit `ssl` option and print a noisy
// deprecation warning on every boot. Strip them and let the ssl object below
// be the single source of truth.
function cleanConnectionString(raw) {
  if (!raw) return raw;
  const url = new URL(raw);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('channel_binding');
  return url.toString();
}

export const pool = new Pool({
  connectionString: cleanConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('[db] idle client error:', err.message));

/** Run a query and return rows. */
export async function q(text, params = []) {
  const started = Date.now();
  const res = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[db] ${Date.now() - started}ms  ${text.split('\n')[0].slice(0, 70)}`);
  }
  return res.rows;
}

/** Run a query and return the first row (or null). */
export async function one(text, params = []) {
  const rows = await q(text, params);
  return rows[0] ?? null;
}

/** Write an audit row. Never throws — logging must not break a request. */
export async function logActivity(applicationId, agent, action, detail = '', success = true) {
  try {
    await q(
      `INSERT INTO activity_log (application_id, agent, action, detail, success)
       VALUES ($1, $2, $3, $4, $5)`,
      [applicationId, agent, action, detail, success]
    );
  } catch (e) {
    console.error('[db] logActivity failed:', e.message);
  }
}
