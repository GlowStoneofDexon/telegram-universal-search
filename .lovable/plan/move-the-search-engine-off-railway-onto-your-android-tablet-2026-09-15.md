# Move the search engine off Railway onto your Android tablet

Goal: stop paying for Railway. Your tablet runs the Telegram search engine for free, with no credit card and no public address needed.

## How it will work

Today the bot sends each search to Railway over the internet and waits for the answer. Railway needs a paid, always-on public address.

New setup: the tablet asks for work instead of waiting to be called.

```text
user -> Comb Search Bot -> job queue (your Lovable backend)
                                 ^   |
                            asks for |  returns results
                             work    v
                        Android tablet (Termux)
```

Because the tablet only makes outgoing requests, it works on mobile data or home Wi-Fi with no tunnel, no port forwarding, no card on file.

## What gets built

1. Job queue in your backend: a small table holding pending searches and their results, plus two protected endpoints — one for the tablet to claim a job, one to post results back. Both guarded by your existing worker secret.
2. Bot side: instead of calling Railway, the bot creates a job and waits briefly for the answer. Typical answer time stays around a second while the tablet is online. If the tablet is offline the user gets a clear "search engine is offline" message rather than a silent failure.
3. Tablet worker: the existing search engine code, unchanged in how it searches Telegram, but driven by a polling loop instead of an incoming web request. Runs under Termux with `node worker.js`.
4. Local link storage on the tablet: a SQLite file (`files.db`) next to the worker, holding file name, file id, size and caption, with an index for fast lookup and duplicate protection. Searches check this local store first, then Telegram. Unlimited by tablet storage, no monthly cost.
5. Anime-only scope: results are filtered to anime-related terms (anime, manga, manhwa, donghua, anime movies and similar). The term list lives in one editable file so you can widen it later.
6. Backup: a command that produces a timestamped copy of `files.db` in a `backups` folder on the tablet, plus an export/import script so you can move the database to another device by copying one file.
7. Docs: Termux setup steps (install, one-time Telegram login, running the worker, keeping it awake) and a `migrate.js` importer for a JSON dump of existing links, if you ever have one.

## Railway

Railway stays untouched until the tablet is confirmed working, then you can delete the service. Nothing in the plan depends on it.

## Technical notes

- New table `search_jobs` (query, category, status, result JSON, timestamps) with service-role-only access; expired rows cleaned by the existing cleanup route.
- New public API routes `POST /api/public/worker/claim` and `POST /api/public/worker/complete`, bearer-authenticated with `MTPROTO_WORKER_SECRET`.
- `search.server.ts` gains a queue transport: insert job, poll for completion up to ~25s, fall back to stale cache, then error. Existing 7-day `search_cache` behaviour is kept — it reduces tablet load.
- `mtproto-worker/worker.js` keeps its GramJS client, transport fallback and category filters; the HTTP server is replaced by a claim/complete loop with backoff. Health endpoint kept on localhost for debugging.
- SQLite via `node:sqlite` (Node 22+ in Termux) with `better-sqlite3` avoided to skip native builds on Android.
- `mtproto-worker/anime-filter.js` holds the allowlist terms and the result filter.
