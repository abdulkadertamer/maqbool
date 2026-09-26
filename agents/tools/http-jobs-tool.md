# TOOL: fetch_jobs  (HTTP Request node in MicroMind Core)

Attach this tool to the **Scout Agent**.

## Option A — Remotive (FREE, no API key, works today)
- Method: `GET`
- URL: `https://remotive.com/api/remote-jobs`
- Query params (make them agent-fillable variables):
  - `search`   = {{keyword}}
  - `limit`    = 10
- Response path to use: `jobs[]`
- Field map:
  | JSON field       | Our field        |
  |------------------|------------------|
  | `id`             | external_id      |
  | `title`          | title            |
  | `company_name`   | company          |
  | `candidate_required_location` | location |
  | `job_type`       | employment_type  |
  | `url`            | url              |
  | `publication_date` | posted_at      |
  | `tags`           | tags             |
  | `description`    | jd_excerpt (strip HTML, first 600 chars) |

## Option B — Adzuna (FREE tier, needs app_id + app_key)
- Sign up: https://developer.adzuna.com/
- `GET https://api.adzuna.com/v1/api/jobs/eg/search/1`
- Params: `app_id`, `app_key`, `results_per_page=10`, `what={{keyword}}`, `where={{location}}`
- Covers **Egypt** specifically — better local relevance than Remotive.

## Option C — Jooble (FREE, needs key)
- Sign up: https://jooble.org/api/about
- `POST https://jooble.org/api/{{API_KEY}}` with body `{"keywords": "...", "location": "Egypt"}`

## Tool description to paste into the node
```
fetch_jobs — Returns real, currently-open job listings matching a keyword.
Input: keyword (string, required), location (string, optional).
Use this whenever the user asks to find, search for, or discover job openings.
Never answer job-search questions without calling this tool first.
```

## Headers (all options)
```
Accept: application/json
User-Agent: Maqbool/1.0
```
