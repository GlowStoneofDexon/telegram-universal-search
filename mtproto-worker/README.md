# Comb Search Bot — search engine (runs free on your Android tablet)

This folder is the part of the bot that talks to Telegram. It used to run on
Railway. It now runs on your own device under Termux, for free.

It **pulls** work from the bot instead of being called, so your tablet needs
no public address, no tunnel, no port forwarding and no credit card. Mobile
data or home Wi-Fi is enough.

```
user -> Comb Search Bot -> job queue -> your tablet -> results back
```

## One-time setup on the tablet

Install Termux from F-Droid (not the Play Store version), then:

```sh
pkg update && pkg upgrade
pkg install nodejs-lts git
git clone <your repo url>
cd <repo>/mtproto-worker
npm install
```

Node 22 or newer is required (the local link store uses Node's built-in SQLite).
Check with `node -v`.

## Settings

Create a `.env` file in this folder:

```
TELEGRAM_API_ID=your api id
TELEGRAM_API_HASH=your api hash
TELEGRAM_SESSION=generated below
MTPROTO_WORKER_SECRET=same value as in your Lovable secrets
BOT_BASE_URL=https://combsearchbot.lovable.app
```

Generate the session once (asks for phone number + code):

```sh
npm run login
```

Paste the printed string into `TELEGRAM_SESSION`.

## Run it

```sh
npm start
```

Leave the window open. To stop Android from killing it:

```sh
pkg install termux-services
termux-wake-lock
```

Restart automatically after a crash:

```sh
while true; do npm start; sleep 5; done
```

## Local link storage

Every link the engine finds is stored in `files.db` next to the worker, and
saved links are blended into future searches. Size is limited only by the free
space on the tablet.

Table: `files(file_name, file_id UNIQUE, file_size, caption, link, username, kind)`
with an index on `file_name`.

## Backup / moving to another device

```sh
npm run backup
```

This writes a timestamped copy into `mtproto-worker/backups/`. Copy that one
file anywhere you like; to restore, rename it back to `files.db` in this folder.

## Importing an old dump

If you have a JSON export of links (array or one JSON object per line):

```sh
npm run migrate -- dump.json
```

Recognised keys: `file_name`, `file_id`, `file_size`, `caption`, `link`.

## Scope

The bot answers anime-related searches: anime, manga, manhwa, donghua, anime
movies and similar. The word list lives in `anime-filter.js` — add more terms
there whenever you want to widen it.

## Railway

Nothing here depends on Railway any more. Once the tablet is answering
searches, you can delete the Railway service.
