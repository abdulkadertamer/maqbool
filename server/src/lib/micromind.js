import 'dotenv/config';

const URL_ = process.env.MICROMIND_API_URL;
const KEY = process.env.MICROMIND_API_KEY;

export const isConfigured = () => Boolean(URL_);

/**
 * Send a question to the Maqbool Master Agent running on MicroMind Core.
 * sessionId keeps conversation memory alive (needed by the Coach Agent).
 */
export async function ask(question, { sessionId, vars = {} } = {}) {
  if (!URL_) {
    const e = new Error('MICROMIND_API_URL is not set in server/.env');
    e.code = 'NOT_CONFIGURED';
    throw e;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (KEY) headers.Authorization = `Bearer ${KEY}`;

  const body = { question };
  if (sessionId) {
    body.overrideConfig = { sessionId, vars };
  } else if (Object.keys(vars).length) {
    body.overrideConfig = { vars };
  }

  const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(body) });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MicroMind ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  // Flowise-style responses vary; normalise the common shapes.
  const answer = data.text ?? data.answer ?? data.output ?? data.result ?? '';
  return { answer, raw: data };
}

/**
 * Ask the agent for JSON and parse it defensively.
 * LLMs often wrap JSON in ```json fences even when told not to.
 */
export async function askJSON(question, opts = {}) {
  const { answer, raw } = await ask(question, opts);
  const cleaned = String(answer)
    .replace(/^[\s\S]*?```(?:json)?/i, '')
    .replace(/```[\s\S]*$/, '')
    .trim();
  const candidate = cleaned || String(answer).trim();

  try {
    return { data: JSON.parse(candidate), raw };
  } catch {
    // last resort: grab the outermost {...} or [...]
    const m = candidate.match(/[{[][\s\S]*[}\]]/);
    if (m) {
      try { return { data: JSON.parse(m[0]), raw }; } catch { /* fall through */ }
    }
    const e = new Error('Agent did not return valid JSON');
    e.received = String(answer).slice(0, 500);
    throw e;
  }
}
