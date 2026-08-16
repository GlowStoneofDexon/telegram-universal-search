# Comb Search Bot — Telegram Universal Search

A stateless Telegram search bot (@CombSearchBot) that queries Telegram's global index in real time across categories: Channels, Chats, Groups, Files, Videos, Audios. No database, no stored results.

## Architecture

Telegram's global search is only reachable through the MTProto client API, which needs a persistent raw TCP connection and a logged-in user session. This app's backend runs on a serverless edge runtime that cannot hold such a connection, so the system splits in two:

```text
Telegram user
   |  message to @CombSearchBot
   v
This Lovable app  (webhook + bot logic + formatting)
   |  HTTPS POST /search  (shared secret)
   v
MTProto worker  (GramJS, Node, you host it)
   |  Api.messages.SearchGlobal / contacts.Search
   v
Telegram servers
```

Nothing is persisted at any layer — every request is a pass-through.

## Part 1 — MTProto worker (code delivered in this repo, deployed by you)

A standalone folder `mtproto-worker/` (own package.json, plain Node + GramJS + a tiny HTTP server) that you deploy to Railway / Fly / a VPS.

- `POST /search` with `{ query, category, limit }`, guarded by an `Authorization: Bearer <MTPROTO_WORKER_SECRET>` header.
- Reads `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION`, `MTPROTO_WORKER_SECRET` from environment variables only — nothing hardcoded.
- One shared GramJS client, connected lazily, reused across requests.
- Category mapping:
  - Files / Videos / Audios → `Api.messages.SearchGlobal` with `InputMessagesFilterDocument` / `Video` / `Music` (voice included as an audio fallback), limit 10.
  - Chats (default) → `Api.messages.SearchGlobal` with `Api.InputMessagesFilterEmpty`, limit 10.
  - Channels / Groups → `Api.contacts.Search` (global public entity search), filtered client-side to broadcast vs. megagroup/chat.
- Returns normalized JSON: `{ results: [{ type, title, username, snippet, link, date }] }`, built from the response's chats/users maps. Errors return a clean `{ error }` plus the upstream status.
- `login.mjs` in the same folder: a one-time interactive script you run locally (`node login.mjs`) that asks for phone number, login code and 2FA password, then prints the session string. You save that string as the worker's `TELEGRAM_SESSION` env var. It is never committed or sent to this app.

## Part 2 — Bot in this app

- Public webhook route `src/routes/api/public/telegram/webhook.ts`, verifying Telegram's `X-Telegram-Bot-Api-Secret-Token` header before doing anything, and returning 200 quickly.
- Bot flow:
  - `/start` and `/help` → short intro plus category buttons.
  - Any text message → treated as a query; runs the default "Chats" search and replies with results plus an inline keyboard of the six categories.
  - Tapping a category → `callback_query` re-runs the same query under that filter and edits the message in place. The query is carried inside the callback payload, so no server-side state exists.
  - Empty results, worker unreachable, or Telegram rate limits → a plain, friendly message.
- Results render as a numbered list: title, `@username`, a trimmed snippet, and a `t.me` deep link where one can be derived.
- Outgoing replies go through the Telegram connector gateway (`sendMessage`, `editMessageText`, `answerCallbackQuery`) — the bot token stays with the connector.
- Web page at `/` is a simple branded status/landing page for Comb Search Bot with a link to open the bot; searching happens in Telegram only, per your choice.

## Secrets

Stored in this app: `MTPROTO_WORKER_URL`, `MTPROTO_WORKER_SECRET` (I generate it), plus the existing Telegram connector key.
Stored on the worker host: `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION`, `MTPROTO_WORKER_SECRET` (same value).

## What you do after I build

1. Run `node login.mjs` locally once, using your my.telegram.org api_id/api_hash, to get the session string.
2. Deploy `mtproto-worker/` and set its four env vars.
3. Paste the worker's public URL back to me; I register the bot webhook with Telegram and we test end to end.

## Notes and limits

- Global search only covers public channels/groups and content Telegram indexes; it is not a full "everything on Telegram" index.
- The user account behind the session is subject to Telegram flood limits — heavy use can temporarily throttle searches.
