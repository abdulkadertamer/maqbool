const BASE = "https://gsm-direct-foster-municipal.trycloudflare.com";

const action = $action;
const company = $company || "";
const role = $role || "";
const status = $status || "";
const applicationId = $applicationId || "";
const notes = $notes || "";

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
} else {
  return JSON.stringify({ error: "Unknown action. Use list, create, update, or stats." });
}

const res = await fetch(url, opts);
const data = await res.json();
return JSON.stringify(data);
