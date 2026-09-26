const BASE = "https://gsm-direct-foster-municipal.trycloudflare.com";

const action = $action;
const company = $company || "";
const role = $role || "";
const status = $status || "";
const applicationId = $applicationId || "";
const notes = $notes || "";
const matchScore = $matchScore;
const verdict = $verdict || "";
const matchingSkills = $matchingSkills || [];
const missingSkills = $missingSkills || [];
const gapPlan = $gapPlan || "";
const docType = $docType || "cover_letter";
const language = $language || "en";
const content = $content || "";

let url, opts = { headers: { "Content-Type": "application/json" } };

if (action === "list") {
  url = `${BASE}/api/applications`;
} else if (action === "stats") {
  url = `${BASE}/api/stats`;
} else if (action === "create") {
  url = `${BASE}/api/applications`;
  opts.method = "POST";
  opts.body = JSON.stringify({ company, role, status: status || "Saved", notes });
} else if (action === "update") {
  url = `${BASE}/api/applications/${applicationId}`;
  opts.method = "PATCH";
  opts.body = JSON.stringify({ status, notes });
} else if (action === "save_fit") {
  url = `${BASE}/api/applications/${applicationId}/fit/save`;
  opts.method = "POST";
  opts.body = JSON.stringify({
    match_score: matchScore, verdict, matching_skills: matchingSkills,
    missing_skills: missingSkills, gap_plan: gapPlan,
  });
} else if (action === "save_document") {
  url = `${BASE}/api/applications/${applicationId}/document/save`;
  opts.method = "POST";
  opts.body = JSON.stringify({ doc_type: docType, language, content });
} else if (action === "search_jobs") {
  url = `${BASE}/api/jobs/search?keyword=${encodeURIComponent(company || "AI")}&limit=10`;
} else {
  return JSON.stringify({ error: "Unknown action." });
}

const res = await fetch(url, opts);
const data = await res.json();
return JSON.stringify(data);
