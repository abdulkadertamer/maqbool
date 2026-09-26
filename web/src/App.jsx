import { useEffect, useState, useRef } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function api(path, opts) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Pipeline() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/api/applications').then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty">Couldn't load the pipeline: {error}</div>;
  if (!rows) return <div className="empty">Loading…</div>;
  if (rows.length === 0) return <div className="empty">No applications yet. Save one from the chat to see it here.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Company</th><th>Role</th><th>Status</th><th>Fit</th><th>Applied</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="company">{r.company}</td>
            <td className="role">{r.role}</td>
            <td><span className={`badge ${r.status}`}>{r.status}</span></td>
            <td>{r.match_score != null ? `${r.match_score}%` : '—'}</td>
            <td>{r.applied_at ? new Date(r.applied_at).toLocaleDateString() : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stats() {
  const [s, setS] = useState(null);

  useEffect(() => {
    api('/api/stats').then(setS).catch(() => {});
  }, []);

  const f = s?.funnel ?? {};
  return (
    <div className="stats-row">
      <StatCard label="Applications" value={f.total ?? '—'} />
      <StatCard label="Interviews" value={f.interviews ?? '—'} sub={f.interviewRate ? `${f.interviewRate}% rate` : null} />
      <StatCard label="Offers" value={f.offers ?? '—'} />
      <StatCard label="Avg. Fit Score" value={s?.avgScore != null ? `${s.avgScore}%` : '—'} />
    </div>
  );
}

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'system', text: 'Ask Maqbool to find jobs, score a fit, write a cover letter, or check your pipeline.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const { answer } = await api('/api/chat', { method: 'POST', body: JSON.stringify({ message: text }) });
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Couldn't reach the agent: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-log" ref={logRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
        {busy && <div className="msg assistant">…</div>}
      </div>
      <div className="chat-input">
        <input
          value={input}
          placeholder="e.g. find me AI internships in Egypt"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={busy || !input.trim()}>Send</button>
      </div>
    </div>
  );
}


function Activity() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api('/api/stats').then((s) => setRows(s.recent ?? [])).catch(() => setRows([]));
  }, []);

  if (!rows) return <div className="empty">Loading…</div>;
  if (rows.length === 0) return <div className="empty">No agent activity recorded yet.</div>;

  return (
    <div className="timeline">
      {rows.map((r, i) => (
        <div className="tl-row" key={i}>
          <span className={`agent-chip ${r.agent}`}>{r.agent}</span>
          <span className="tl-action">{r.action.replace(/_/g, ' ')}</span>
          <span className="tl-detail">{r.company ? `${r.company} — ` : ''}{r.detail}</span>
          <span className="tl-time">{new Date(r.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('overview');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api('/api/health').then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <h1>Maqbool</h1>
            <span>Career operations, run by agents</span>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>Activity</button>
          <button className={`tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>Chat</button>
        </div>
      </div>

      {health && !health.agentConnected && (
        <div className="notice">The Master Agent isn't connected yet — set MICROMIND_API_URL in server/.env to enable chat.</div>
      )}

      {tab === 'overview' && (
        <>
          <Stats />
          <div className="panel">
            <h2>Pipeline</h2>
            <Pipeline />
          </div>
        </>
      )}

      {tab === 'activity' && (
        <div className="panel">
          <h2>Agent activity</h2>
          <Activity />
        </div>
      )}

      {tab === 'chat' && (
        <div className="panel">
          <h2>Ask Maqbool</h2>
          <Chat />
        </div>
      )}
    </div>
  );
}
