# LinkedIn post — Maqbool

Paste as-is. Tag AI MicroMind and Ahmed Abd El-Ghaffar using LinkedIn's @ mention
so they render as real links. Attach the demo video.

---

Last summer I applied to around fifteen internships. The hardest part was never
writing the cover letter. It was deciding which roles were worth the hour it
takes to apply properly.

I'd read a job description, convince myself I was qualified, apply, and hear
nothing back. No signal either way.

So for my final project at AI MicroMind, I built Maqbool.

Maqbool is a career-operations platform run by agents. It finds real openings,
scores how well I actually match them, drafts the application materials, and
keeps everything in a live database with a full audit trail.

What I want to point at is the Fit Agent, because I built it to be blunt on
purpose.

The score is not a vibe. It extracts every requirement from the job description,
labels each one must-have or nice-to-have, and then has to find a named project
or role in my CV as evidence. A skill I listed with nothing behind it counts as
unmet. The formula is fixed:

match_score = 70 × (must-haves met) + 30 × (nice-to-haves met)

One of the roles in my pipeline scored 44%. The agent told me not to apply, and
it was right. That is the feature. Most tools in this space are built to make
you feel good about yourself. This one returns a field called honest_note and is
instructed never to inflate a score to be encouraging.

Under the hood:

• Master Agent with a single tool, routing and reasoning
• Custom tool calling an Express API — the agents never hold the database
  password
• PostgreSQL on Neon: 7 tables, a pipeline view, and an audit log
• Live job data pulled from a real jobs API, not seeded
• React dashboard showing the pipeline, the agent activity timeline, and a chat
  panel

The design decision I'd defend in an interview: every write goes through one
API. That means one place validates the status vocabulary and one place writes
the audit log. An agent that hallucinates a status gets a 400, not a corrupted
row. Deciding what an agent is allowed to touch directly, and what has to pass
through a boundary you control, turned out to be the actual engineering problem
— not the prompting.

Next up is a Coach Agent that runs mock interviews scored against the specific
job description.

A sincere thank you to Eng. Ahmed Abd El-Ghaffar for the guidance and feedback
throughout the training, and to AI MicroMind for an environment where the
assignment was to build something real rather than study concepts.

Demo video below.

#AI #AgenticAI #AIAgents #AIEngineering #SoftwareEngineering #PostgreSQL #React #AIMicroMind #StudentProject #BuildInPublic
