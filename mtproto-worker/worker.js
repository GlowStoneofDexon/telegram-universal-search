// Comb Search Bot - MTProto worker
// Deploy this folder on its own (Railway / Render / Fly / VPS).
// It holds the long-lived Telegram MTProto (GramJS) connection that the
// serverless bot backend cannot hold itself.

import express from "express";
import dotenv from "dotenv";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

dotenv.config();

const {
  TELEGRAM_API_ID,
  TELEGRAM_API_HASH,
  TELEGRAM_SESSION,
  MTPROTO_WORKER_SECRET,
  PORT = 8080,
} = process.env;

const missing = [
  ["TELEGRAM_API_ID", TELEGRAM_API_ID],
  ["TELEGRAM_API_HASH", TELEGRAM_API_HASH],
  ["TELEGRAM_SESSION", TELEGRAM_SESSION],
  ["MTPROTO_WORKER_SECRET", MTPROTO_WORKER_SECRET],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error("Missing required environment variables: " + missing.join(", "));
  process.exit(1);
}

// Some hosts block raw MTProto TCP ports, others break websocket upgrades, so
// try websockets first and fall back to plain TCP before giving up.
const session = new StringSession(TELEGRAM_SESSION);

function makeClient(useWSS) {
  const c = new TelegramClient(session, parseInt(TELEGRAM_API_ID, 10), TELEGRAM_API_HASH, {
    connectionRetries: 2,
    retryDelay: 1000,
    timeout: 15,
    useWSS,
    autoReconnect: true,
  });
  c.setLogLevel?.("warn");
  return c;
}

let client = makeClient(true);
let connecting = null;
let connected = false;
let lastConnectError = null;
let transport = null;

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function tryConnect(useWSS) {
  const candidate = client && transport === (useWSS ? "wss" : "tcp") ? client : makeClient(useWSS);
  await withTimeout(candidate.connect(), 20000, `Telegram connect (${useWSS ? "wss" : "tcp"})`);
  const authorized = await withTimeout(
    candidate.isUserAuthorized(),
    15000,
    "Telegram authorization check",
  );
  if (!authorized) {
    throw new Error("TELEGRAM_SESSION is not authorized. Re-run `npm run login`.");
  }
  client = candidate;
  transport = useWSS ? "wss" : "tcp";
  connected = true;
  lastConnectError = null;
  console.log(`Connected to Telegram via MTProto (${transport})`);
}

async function ensureConnected() {
  if (connected && client.connected) return;
  connected = false;
  if (!connecting) {
    connecting = (async () => {
      try {
        await tryConnect(true);
      } catch (wssError) {
        const wssMessage = wssError?.errorMessage ?? wssError?.message ?? String(wssError);
        console.error("Websocket connect failed, falling back to TCP:", wssMessage);
        try {
          await tryConnect(false);
        } catch (tcpError) {
          const tcpMessage = tcpError?.errorMessage ?? tcpError?.message ?? String(tcpError);
          lastConnectError = `wss: ${wssMessage} | tcp: ${tcpMessage}`;
          console.error("Telegram connect failed:", lastConnectError);
          throw tcpError;
        }
      }
    })().catch((error) => {
      connecting = null;
      throw error;
    });
  }
  await connecting;
}

// Warm the connection at boot so the first search is fast and startup problems
// show up in the deploy logs immediately.
ensureConnected().catch(() => {});


const messageFilters = {
  chats: () => new Api.InputMessagesFilterEmpty(),
  text: () => new Api.InputMessagesFilterEmpty(),
  photos: () => new Api.InputMessagesFilterPhotos(),
  files: () => new Api.InputMessagesFilterDocument(),
  videos: () => new Api.InputMessagesFilterVideo(),
  audios: () => new Api.InputMessagesFilterMusic(),
  links: () => new Api.InputMessagesFilterUrl(),
};

const ENTITY_CATEGORIES = new Set(["channels", "groups", "bots"]);
const MEDIA_CATEGORIES = new Set(["photos", "files", "videos", "audios", "links"]);

function toNumber(value) {
  if (value === undefined || value === null) return null;
  try {
    return Number(value.toString());
  } catch {
    return null;
  }
}

function detectType(message) {
  const media = message.media;
  if (!media) return "message";
  const className = media.className;
  if (className === "MessageMediaPhoto") return "photo";
  if (className === "MessageMediaWebPage") return "link";
  if (className === "MessageMediaDocument") {
    const attributes = media.document?.attributes ?? [];
    if (attributes.some((a) => a.className === "DocumentAttributeAudio")) return "audio";
    if (attributes.some((a) => a.className === "DocumentAttributeVideo")) return "video";
    return "file";
  }
  return "message";
}

function dedupe(items, limit) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item.messageId
      ? `${item.username ?? item.title}:${item.messageId}`
      : `u:${item.username ?? item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

// A single keyword and its individual words both matter: "anime movie" should
// return the phrase matches AND the broader "anime" / "movie" matches mixed in.
function queryVariants(query) {
  const words = query.split(/\s+/).filter((w) => w.length >= 3);
  const variants = [query];
  if (words.length > 1) variants.push(...words.slice(0, 3));
  return [...new Set(variants)];
}

async function rawEntitySearch(query) {
  const result = await withTimeout(
    client.invoke(new Api.contacts.Search({ q: query, limit: 50 })),
    30000,
    "Telegram entity search",
  );
  const items = [];

  for (const chat of result.chats ?? []) {
    let isBroadcast = null;
    if (chat.className === "Channel") isBroadcast = Boolean(chat.broadcast);
    else if (chat.className === "Chat") isBroadcast = false;
    else continue;

    const username = chat.username ?? chat.usernames?.[0]?.username ?? null;
    items.push({
      type: isBroadcast ? "channel" : "group",
      title: chat.title ?? "Untitled",
      username,
      snippet: "",
      link: username ? `t.me/${username}` : null,
      date: chat.date ? new Date(chat.date * 1000).toISOString() : null,
      members: chat.participantsCount ?? 0,
      messageId: null,
    });
  }

  for (const user of result.users ?? []) {
    if (!user.bot) continue;
    const username = user.username ?? user.usernames?.[0]?.username ?? null;
    if (!username) continue;
    items.push({
      type: "bot",
      title: [user.firstName, user.lastName].filter(Boolean).join(" ") || username,
      username,
      snippet: "",
      link: `t.me/${username}`,
      date: null,
      members: 0,
      messageId: null,
    });
  }

  return items;
}

async function searchEntities(query, category, limit) {
  const batches = await Promise.all(queryVariants(query).map((q) => rawEntitySearch(q).catch(() => [])));
  let items = batches.flat();

  if (category === "channels") items = items.filter((i) => i.type === "channel");
  else if (category === "groups") items = items.filter((i) => i.type === "group");
  else if (category === "bots") items = items.filter((i) => i.type === "bot");

  items.sort((a, b) => (b.members ?? 0) - (a.members ?? 0));
  return dedupe(items, limit);
}

async function rawMessageSearch(query, makeFilter, limit) {
  const result = await withTimeout(
    client.invoke(
      new Api.messages.SearchGlobal({
        q: query,
        filter: makeFilter(),
        minDate: 0,
        maxDate: 0,
        offsetRate: 0,
        offsetPeer: new Api.InputPeerEmpty(),
        offsetId: 0,
        limit,
      }),
    ),
    30000,
    "Telegram message search",
  );

  const peers = new Map();
  for (const chat of result.chats ?? []) peers.set(toNumber(chat.id), chat);
  for (const user of result.users ?? []) peers.set(toNumber(user.id), user);

  const results = [];
  for (const message of result.messages ?? []) {
    // Private one-to-one chats (including this account's own conversations)
    // must never leak into public search output.
    if (!message.peerId?.channelId && !message.peerId?.chatId) continue;

    const peerId = toNumber(message.peerId?.channelId) ?? toNumber(message.peerId?.chatId);
    const peer = peers.get(peerId);
    if (!peer || (peer.className !== "Channel" && peer.className !== "Chat")) continue;

    const username = peer.username ?? peer.usernames?.[0]?.username ?? null;
    results.push({
      type: detectType(message),
      title: peer.title || "Unknown",
      username,
      snippet: message.message ?? "",
      link: username ? `t.me/${username}/${message.id}` : null,
      date: message.date ? new Date(message.date * 1000).toISOString() : null,
      members: peer.participantsCount ?? 0,
      messageId: message.id ?? null,
    });
  }
  return results;
}

function linkOf(result) {
  const match = (result.snippet ?? "").match(/https?:\/\/[^\s]+|t\.me\/[^\s]+/i);
  return match ? match[0] : null;
}

async function searchMessages(query, category, limit) {
  const makeFilter = messageFilters[category] ?? messageFilters.chats;
  const variants = queryVariants(query);
  const batches = await Promise.all(
    variants.map((q) => rawMessageSearch(q, makeFilter, Math.max(limit, 30)).catch(() => [])),
  );
  let results = batches.flat();

  if (category === "links") {
    // Only keep posts that really carry a link, and expose it as the target.
    results = results
      .map((r) => ({ ...r, externalLink: linkOf(r) }))
      .filter((r) => r.type === "link" || r.externalLink)
      .map((r) => ({ ...r, type: "link", link: r.link ?? r.externalLink }));
  }

  return dedupe(results, limit);
}

async function searchMixed(query, limit) {
  const [entities, messages, photos, videos] = await Promise.all([
    searchEntities(query, "chats", limit).catch(() => []),
    searchMessages(query, "chats", limit).catch(() => []),
    searchMessages(query, "photos", Math.ceil(limit / 3)).catch(() => []),
    searchMessages(query, "videos", Math.ceil(limit / 3)).catch(() => []),
  ]);
  const head = entities.slice(0, Math.ceil(limit / 2));
  const tail = shuffle([...messages, ...photos, ...videos]);
  return dedupe([...head, ...tail], limit);
}

async function searchTelegram(query, category, limit) {
  await ensureConnected();
  if (category === "all") return searchMixed(query, limit);
  if (ENTITY_CATEGORIES.has(category)) return searchEntities(query, category, limit);
  if (MEDIA_CATEGORIES.has(category)) return searchMessages(query, category, limit);
  // "chats" = public channels/groups matching the keyword (directory style)
  // blended with the matching public posts.
  const [entities, messages] = await Promise.all([
    searchEntities(query, "chats", limit).catch(() => []),
    searchMessages(query, "chats", limit).catch(() => []),
  ]);
  return dedupe([...entities, ...messages], limit);
}


const app = express();
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    connected,
    lastConnectError,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post("/search", async (req, res) => {
  if (req.headers.authorization !== `Bearer ${MTPROTO_WORKER_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category : "all";
  const requested = Number(req.body?.limit ?? 10);
  const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 10, 1), 60);

  if (query.length < 2) {
    return res.status(400).json({ error: "Query must be at least 2 characters" });
  }

  try {
    const results = await searchTelegram(query, category, limit);
    res.json({
      results,
      query,
      category,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error?.errorMessage ?? error?.message ?? "Unknown error";
    console.error(`Search failed [${category}] "${query}":`, message);
    const flood = /FLOOD_WAIT/i.test(String(message));
    res.status(flood ? 429 : 500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`MTProto worker listening on port ${PORT}`);
});
