# مقبول · Maqbool

**From "I applied" to "I'm accepted."**

An agentic career-operations platform. Most job trackers are spreadsheets with
extra steps — you still do all the thinking. Maqbool puts agents behind the
pipeline: they search real openings, score your actual fit against them with
evidence, draft the application materials, and keep every record in a live
database with a full audit trail.

Built on **AI MicroMind Core** as my final project for the 125-hour Agentic AI
training at Creativa Mansoura.

---

## Why this, and not another chatbot

The thing I kept running into while applying to internships: the hard part isn't
writing the cover letter, it's knowing whether a role is worth the hour it takes
to apply. So the centre of this project is the **Fit Agent** — and it's
deliberately built to be blunt. It returns an `honest_note` field and is
instructed never to inflate a score to be encouraging. If you shouldn't apply, it
says so.

Everything else exists to serve that: the Scout finds real openings to score, the
Writer only drafts once a fit is known, and the Tracker keeps the history so the
scores mean something over time.

---

## Architecture

```
                    ┌──────────────┐
   you ───────────► │ Master Agent │  routing + reasoning
                    └──────┬───────┘
                           │  one tool: manage_applications
                           ▼
                    ┌──────────────┐
                    │  Express API │  ◄─── Remotive jobs API
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │  Neon — 7 tables + pipeline view
                    └──────────────┘
                           ▲
                    ┌──────┴───────┐
                    │  React app   │  pipeline · activity · chat
                    └──────────────┘
```

**Design decision worth calling out:** the agents don't hold credentials or talk
to Postgres directly. Every write goes through the Express API, which means one
place enforces the status vocabulary, one place writes the audit log, and the
database password never leaves the server. An agent that hallucinates a status
gets a 400, not a corrupted row.

---

## The agents

| Agent | Job | How it's wired |
|---|---|---|
| **Master** | Routes the request, reasons about fit, composes the reply | Tool Agent + `manage_applications` |
| **Profile** | Raw CV text → structured candidate JSON | Conversation Chain, temp 0.2 |
| **Scout** | Pulls real, currently-open listings | Custom Tool → Remotive API |
| **Fit** | Evidence-based match score + honest verdict | Reasoning in the Master prompt |
| **Writer** | Cover letters, CV bullets, DMs, follow-ups | Reasoning in the Master prompt |
| **Tracker** | The only path to the database | Custom Tool → Express API |

Fit scoring is deterministic, not vibes:
```
match_score = 70 × (must_haves_met / total_must_haves)
            + 30 × (nice_to_haves_met / total_nice_to_haves)
```
Every requirement must be matched to a **named** CV item as proof. A skill listed
with no project behind it counts as unmet.

---

## Stack

React · Vite · Node · Express · PostgreSQL (Neon) · AI MicroMind Core (Flowise) · Remotive API

---

## Running it

### 1. Database
```bash
# in the Neon SQL editor
\i db/schema.sql
\i db/seed.sql     # optional — sample pipeline
```

### 2. Backend
```bash
cd server
cp .env.example .env     # fill in DATABASE_URL and MICROMIND_API_URL
npm install
npm run check            # verifies DB, agent, and jobs API
npm run dev
```

### 3. Frontend
```bash
cd web
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

### 4. Agents
Import the prompts from `agents/` into MicroMind Core. Each file has the system
prompt in a fenced block; `agents/flowise-ready/` has the same prompts with curly
braces escaped, which Flowise's prompt templates require.

You'll need your own LLM API key in the Chat Model node — the project is
model-agnostic, but the Tool Agent needs a model with reliable tool-calling
support.

---

## Repo map

```
agents/              system prompts, one file per agent
  flowise-ready/     brace-escaped versions + custom tool code
db/
  schema.sql         7 tables, 1 view, indexes
  seed.sql           sample pipeline data
server/
  src/lib/           db pool, agent proxy, health check
  src/routes/        profile · jobs · applications · chat · stats
web/
  src/App.jsx        dashboard, activity timeline, chat
docs/
```

---

## What's next

- Coach Agent — multi-turn mock interviews scored against the JD
- Email ingestion, so status changes are detected instead of typed
- Deploy the backend so the agents don't need a tunnel

---

Built by [Abdulkader Tamer](https://linkedin.com/in/abdulkader-tamer-b65193294) —
AI Engineering, Mansoura National University.
