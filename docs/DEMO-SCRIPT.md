# Maqbool — 3-minute demo script

Total: ~2:50. Record in one take if you can; pauses are fine, dead air isn't.
Speak over the screen — don't read this word for word, use it as the spine.

**Before you hit record**
- Backend running (`cd server && npm run dev`)
- Frontend running (`cd web && npm run dev`), browser on localhost:5173
- Flowise open in a second tab, Master Agent chatflow loaded
- Neon SQL editor open in a third tab
- Close Slack/WhatsApp/notifications

---

## 0:00 – 0:25 · The problem

**On screen:** the Maqbool dashboard, Overview tab.

> "Last summer I applied to about fifteen internships. The hardest part wasn't
> writing cover letters — it was deciding which roles were even worth the hour
> it takes to apply properly. I'd read a job description, convince myself I was
> qualified, apply, and hear nothing back.
>
> So for my final project at AI MicroMind, I built Maqbool."

---

## 0:25 – 0:50 · What it is

**On screen:** slowly scroll the pipeline table.

> "Maqbool is a career-operations platform run by agents. It finds real openings,
> scores how well I actually match them, writes the application materials, and
> tracks everything in a live database.
>
> This is my real pipeline — Vodafone, Jumia, Fawry, Orange. Eight applications,
> average fit score of seventy percent, one interview."

---

## 0:50 – 1:25 · The part that matters — honest scoring

**On screen:** point at the Fit column, especially the 44% on Thndr.

> "The centre of this is the Fit Agent, and I built it to be blunt on purpose.
>
> The score isn't a vibe. It pulls every requirement out of the job description,
> labels it must-have or nice-to-have, and then it has to find a *named* project
> or role in my CV as proof. A skill I listed with nothing behind it counts as
> unmet.
>
> Look at Thndr — forty-four percent. The agent told me not to apply, and it was
> right. That's the feature. Most tools like this are built to make you feel
> good. This one returns a field literally called honest_note, and it's
> instructed never to inflate a score to be encouraging."

---

## 1:25 – 2:00 · Show it actually working

**On screen:** switch to Flowise, Master Agent chat. Type live:
```
save a new application: Vodafone, Data Analyst Intern
```
Let it run. Then switch to the Neon SQL editor and run:
```sql
SELECT company, role, status FROM applications ORDER BY id DESC LIMIT 3;
```

> "This isn't a mock-up. The agent has one tool that talks to my Express API,
> and the API is the only thing that touches Postgres.
>
> I'll ask it to save an application... and here's the row, in the real database,
> a second later.
>
> I did it this way on purpose — the agents never hold the database password.
> Every write goes through one API, so there's one place that validates status
> values and one place that writes the audit log. An agent that hallucinates a
> status gets a four-hundred, not a corrupted row."

---

## 2:00 – 2:25 · The audit trail

**On screen:** back to the dashboard, click the **Activity** tab.

> "And because everything goes through that one door, I get this for free — every
> action every agent took, timestamped. Which agent found the job, which one
> scored it, which one drafted the letter, when the status changed.
>
> If I come back in three months and want to know why I stopped pursuing a role,
> it's here."

---

## 2:25 – 2:50 · Close

**On screen:** the Overview tab again, or the GitHub repo.

> "Building this taught me that the interesting problem in agentic systems isn't
> the prompting — it's deciding what the agent is allowed to touch directly and
> what has to go through a boundary you control.
>
> The code's on GitHub. Next up is a Coach Agent for mock interviews scored
> against the actual job description.
>
> Huge thanks to Eng. Ahmed Abd El-Ghaffar for the mentorship throughout the
> training, and to AI MicroMind for the environment to build something real."

---

## Delivery notes

- **Don't apologise or hedge.** No "it's just a simple project" or "it's still
  basic." Present it as the thing it is.
- **The 44% score is your best moment.** Slow down there. Everyone else's demo
  shows their tool praising them; yours shows it telling you no.
- **If a live call fails on camera,** don't panic-restart. Say "the free-tier
  quota on my API key is capped, so let me show you the result from earlier" and
  cut to the Activity tab. Then re-record that section later.
- Record at 1080p minimum. Zoom the browser to ~110% so text is readable on
  a phone.
