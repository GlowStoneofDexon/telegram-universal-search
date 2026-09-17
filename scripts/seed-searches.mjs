// Trickle anime titles into the search queue so the tablet worker can claim them.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/seed-searches.mjs scripts/anime-titles.txt
//
// Options (env):
//   BATCH_SIZE   jobs per batch            (default 75)
//   WAIT_MS      pause between batches     (default 90000)
//   LIMIT_COUNT  limit_count per job       (default 50)
//   CATEGORY     category per job          (default "all")
//   START_AT     skip the first N titles   (default 0)
//
// Jobs are inserted slowly on purpose: claim_search_job() only picks up rows
// younger than 2 minutes, so a bulk insert would be discarded unprocessed.
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "scripts/anime-titles.txt";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 75);
const WAIT_MS = Number(process.env.WAIT_MS ?? 90_000);
const LIMIT_COUNT = Number(process.env.LIMIT_COUNT ?? 50);
const CATEGORY = process.env.CATEGORY ?? "all";
const START_AT = Number(process.env.START_AT ?? 0);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- parse titles (second pipe-delimited field only) -------------------------
const seen = new Set();
const titles = [];
for (const line of readFileSync(file, "utf8").split("\n")) {
  const parts = line.split("|");
  if (parts.length < 2) continue;
  const title = parts[1].trim();
  if (!title) continue;
  const key = title.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  titles.push(title);
}
console.log(`Parsed ${titles.length} unique titles from ${file}`);

// --- titles already cached ---------------------------------------------------
async function loadCachedQueries() {
  const cached = new Set();
  const page = 1000;
  for (let offset = 0; ; offset += page) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/search_cache?select=search_query&limit=${page}&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`cache read failed: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    for (const row of rows) cached.add(String(row.search_query).toLowerCase());
    if (rows.length < page) break;
  }
  return cached;
}

const cached = await loadCachedQueries();
console.log(`Found ${cached.size} queries already cached — those are skipped`);

const pending = titles.slice(START_AT).filter((t) => !cached.has(t.toLowerCase()));
const batches = Math.ceil(pending.length / BATCH_SIZE);
console.log(
  `Queueing ${pending.length} titles in ${batches} batches of ${BATCH_SIZE}, ` +
    `${WAIT_MS / 1000}s apart (~${Math.round((batches * WAIT_MS) / 3_600_000)}h total)`,
);

let inserted = 0;
let failed = 0;
const started = Date.now();

for (let i = 0; i < pending.length; i += BATCH_SIZE) {
  const batch = pending.slice(i, i + BATCH_SIZE);
  const rows = batch.map((query) => ({
    query,
    category: CATEGORY,
    limit_count: LIMIT_COUNT,
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/search_jobs`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  const n = i / BATCH_SIZE + 1;
  if (res.ok) {
    inserted += batch.length;
    const mins = ((Date.now() - started) / 60_000).toFixed(1);
    console.log(
      `[${new Date().toISOString()}] batch ${n}/${batches} ok — ${inserted} queued, ` +
        `${failed} failed, ${mins} min elapsed (last: "${batch[batch.length - 1]}")`,
    );
  } else {
    failed += batch.length;
    console.error(`[batch ${n}/${batches}] insert failed: ${res.status} ${await res.text()}`);
  }

  if (i + BATCH_SIZE < pending.length) await sleep(WAIT_MS);
}

console.log(`Done. ${inserted} jobs queued, ${failed} failed.`);
