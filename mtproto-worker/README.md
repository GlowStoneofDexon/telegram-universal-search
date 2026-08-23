# Comb Search Bot — MTProto worker

Small Node service that holds a Telegram MTProto (GramJS) user session and
executes global searches. The Lovable app calls it over HTTPS.

## 1. Get a session string (once, on your own machine)

```bash
cd mtproto-worker
npm install
npm run login
```

Enter your `api_id` / `api_hash` from https://my.telegram.org/apps, your phone
number, the login code, and 2FA password if you have one. Copy the printed
session string.

## 2. Deploy

Push this folder to Railway / Render / Fly / any Node host and set:

| Variable | Value |
| --- | --- |
| `TELEGRAM_API_ID` | from my.telegram.org |
| `TELEGRAM_API_HASH` | from my.telegram.org |
| `TELEGRAM_SESSION` | the string from step 1 |
| `MTPROTO_WORKER_SECRET` | the same value stored in the Lovable app |
| `PORT` | provided by the host (defaults to 8080) |

Start command: `npm start`.

## 3. Verify

```bash
curl https://<your-worker-url>/health
```

Then give the worker's base URL back to the Lovable app as `MTPROTO_WORKER_URL`.

## API

`POST /search` — requires `Authorization: Bearer <MTPROTO_WORKER_SECRET>`

```json
{ "query": "anime", "category": "chats", "limit": 10 }
```

Categories: `chats`, `channels`, `groups`, `files`, `videos`, `audios`, `links`.

Response:

```json
{ "results": [{ "type": "channel", "title": "...", "username": "...", "snippet": "...", "link": "t.me/...", "members": 1234 }] }
```

Nothing is stored by the worker; every request is a pass-through.

## Troubleshooting Railway

**Deploy succeeds, then crashes with `code: 'ENOENT'`** — Railway is building the
repository root instead of this folder, so `worker.js` does not exist where it
starts. Fix it in the service settings:

1. Settings → Source → **Root Directory** = `mtproto-worker`
2. Settings → Deploy → **Start Command** = `node worker.js` (or leave blank; `railway.json` sets it)
3. Redeploy.

**Variables the worker needs on Railway** (and only these):
`TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION`, `MTPROTO_WORKER_SECRET`.
Do **not** set `MTPROTO_WORKER_URL` or `TELEGRAM_BOT_TOKEN` on Railway — those
belong in the Lovable app. `PORT` is injected by Railway automatically.

`MTPROTO_WORKER_SECRET` must be byte-identical on Railway and in the Lovable app,
otherwise every search returns 401.

**Health says `connected: false` and every search hangs / times out** — the
`TELEGRAM_SESSION` string is not valid for the `TELEGRAM_API_ID` /
`TELEGRAM_API_HASH` currently configured (Telegram accepts the TCP connection
but never answers the first request). Regenerate it:

```bash
cd mtproto-worker
npm install
npm run login   # use the SAME api_id / api_hash that Railway has
```

Paste the new string into Railway's `TELEGRAM_SESSION` variable and redeploy.
`/health` should then report `connected: true` (and `lastConnectError: null`).
