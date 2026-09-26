const BASE = "https://gsm-direct-foster-municipal.trycloudflare.com";

const keyword = $keyword || "AI";
const limit = $limit || 10;

const url = `${BASE}/api/jobs/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
const res = await fetch(url);
const data = await res.json();

const light = (data.jobs || []).map(j => ({
  title: j.title,
  company: j.company,
  location: j.location,
  type: j.employment_type,
  url: j.url,
  posted_at: j.posted_at,
}));

return JSON.stringify({ query_used: data.query_used, count: light.length, jobs: light });
