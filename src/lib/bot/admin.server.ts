import {
  activeUserIds,
  addAd,
  addForcedChannel,
  clearState,
  deactivateUser,
  deleteAd,
  deleteForcedChannel,
  featuredSearches,
  forcedChannels,
  isAdmin,
  listAds,
  listReports,
  recordBroadcast,
  resolveReport,
  setState,
  stats,
  toggleFeatured,
  topSearches,
  addPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
  togglePostActive,

  setSetting,
  sponsorText,
  SPONSOR_KEY,
  type PendingState,
} from "./db.server";
import { answerCallback, callTelegramSafe, copyMessage, editMessage, sendMessage } from "./telegram.server";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const ADMIN_PANEL = [
  "🔐 <b>Admin panel</b>",
  "",
  "Manage featured searches, ads, reports, broadcasts and forced-join channels.",
].join("\n");

export function adminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔝 Top 10 searches", callback_data: "a:top" },
        { text: "📊 Statistics", callback_data: "a:stats" },
      ],
      [
        { text: "📣 Featured ads", callback_data: "a:ads" },
        { text: "⚠️ Reports", callback_data: "a:reports" },
      ],
      [
        { text: "📢 Broadcast message", callback_data: "a:bc" },
        { text: "🔗 Forced join channels", callback_data: "a:fc" },
      ],
      [
        { text: "💠 Sponsor block", callback_data: "a:sp" },
        { text: "🗂 Posts", callback_data: "a:posts" },
      ],
    ],
  };
}

const backRow = [{ text: "⬅️ Back", callback_data: "a:home" }];

/* -------------------------------- sections -------------------------------- */

async function topSection() {
  const [top, featured] = await Promise.all([topSearches(20), featuredSearches()]);
  if (top.length === 0) {
    return { text: "🔝 <b>Top searches</b>\n\nNo searches logged yet.", markup: { inline_keyboard: [backRow] } };
  }
  const lines = ["🔝 <b>Top 20 searches (30 days)</b>", "", "Tap a query to add/remove it from the public Top 10.", ""];
  top.forEach((row, i) => {
    const on = featured.includes(row.query) ? "✅" : "▫️";
    lines.push(`${on} <b>${i + 1}.</b> ${esc(row.query)} — ${row.hits}`);
  });
  lines.push("", `Selected: ${featured.length}/10`);

  const buttons = top.slice(0, 20).map((row, i) => ({
    text: `${featured.includes(row.query) ? "✅" : "➕"} ${i + 1}`,
    callback_data: `a:tt:${row.query.slice(0, 50)}`,
  }));
  const rows: (typeof buttons)[] = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(buttons.slice(i, i + 5));
  return { text: lines.join("\n"), markup: { inline_keyboard: [...rows, backRow] } };
}

async function statsSection() {
  const s = await stats();
  return {
    text: [
      "📊 <b>Statistics</b>",
      "",
      `👤 Users: <b>${s.users}</b>`,
      `🟢 Active (24h): <b>${s.activeToday}</b>`,
      `🔍 Searches: <b>${s.searches}</b>`,
      `🔎 Searches (24h): <b>${s.searchesToday}</b>`,
      `⚠️ Open reports: <b>${s.reports}</b>`,
    ].join("\n"),
    markup: { inline_keyboard: [backRow] },
  };
}

async function adsSection() {
  const ads = await listAds();
  const lines = ["📣 <b>Featured ads</b>", ""];
  if (ads.length === 0) lines.push("No ads yet.");
  ads.forEach((ad, i) => {
    lines.push(`<b>${i + 1}.</b> ${ad.is_active ? "🟢" : "⚪️"} ${esc(ad.title)}`);
    lines.push(`   ${esc(ad.body)}`);
    if (ad.url) lines.push(`   ${esc(ad.url)}`);
  });
  const delButtons = ads.map((ad, i) => ({
    text: `🗑 ${i + 1}`,
    callback_data: `a:adel:${ad.id}`,
  }));
  const rows: unknown[][] = [];
  for (let i = 0; i < delButtons.length; i += 5) rows.push(delButtons.slice(i, i + 5));
  return {
    text: lines.join("\n"),
    markup: {
      inline_keyboard: [[{ text: "➕ Add ad", callback_data: "a:aadd" }], ...rows, backRow],
    },
  };
}

async function reportsSection() {
  const reports = await listReports();
  const lines = ["⚠️ <b>Open reports</b>", ""];
  if (reports.length === 0) lines.push("No open reports.");
  reports.forEach((r, i) => {
    const who = r.username ? `@${esc(r.username)}` : String(r.telegram_id ?? "unknown");
    lines.push(`<b>${i + 1}.</b> ${who} — ${new Date(r.created_at).toLocaleDateString()}`);
    lines.push(`   ${esc(r.message)}`);
  });
  const buttons = reports.map((r, i) => ({ text: `✔️ ${i + 1}`, callback_data: `a:rres:${r.id}` }));
  const rows: unknown[][] = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(buttons.slice(i, i + 5));
  return { text: lines.join("\n"), markup: { inline_keyboard: [...rows, backRow] } };
}

async function forcedSection() {
  const channels = await forcedChannels();
  const lines = ["🔗 <b>Forced join channels</b>", ""];
  if (channels.length === 0) lines.push("No forced channels — the bot is open to everyone.");
  channels.forEach((c, i) => lines.push(`<b>${i + 1}.</b> @${esc(c.username)}${c.title ? ` — ${esc(c.title)}` : ""}`));
  const buttons = channels.map((c, i) => ({ text: `🗑 ${i + 1}`, callback_data: `a:fcdel:${c.id}` }));
  const rows: unknown[][] = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(buttons.slice(i, i + 5));
  return {
    text: lines.join("\n"),
    markup: {
      inline_keyboard: [[{ text: "➕ Add channel", callback_data: "a:fcadd" }], ...rows, backRow],
    },
  };
}

async function sponsorSection() {
  const current = await sponsorText();
  return {
    text: [
      "💠 <b>Sponsor block</b>",
      "",
      "Shown at the bottom of every search result.",
      "",
      current ? `<b>Current:</b>\n${current}` : "<i>Using the built-in default block.</i>",
    ].join("\n"),
    markup: {
      inline_keyboard: [
        [{ text: "✏️ Set sponsor text", callback_data: "a:spset" }],
        [{ text: "♻️ Reset to default", callback_data: "a:spclr" }],
        backRow,
      ],
    },
  };
}

async function postsSection() {
  const posts = await listPosts();
  const lines = ["🗂 <b>Posts</b>", "", "Sent by /posts and the Next/More buttons.", ""];
  if (posts.length === 0) lines.push("No posts yet.");
  posts.forEach((p, i) => {
    const preview = p.body.replace(/\s+/g, " ").slice(0, 60);
    lines.push(`<b>${i + 1}.</b> ${p.is_active ? "🟢" : "⚪️"} ❤️ ${p.likes} — ${esc(preview)}`);
  });
  const rows = posts.map((p, i) => [
    { text: `✏️ ${i + 1}`, callback_data: `a:pedit:${p.id}` },
    { text: p.is_active ? `⏸ ${i + 1}` : `▶️ ${i + 1}`, callback_data: `a:ptog:${p.id}` },
    { text: `🗑 ${i + 1}`, callback_data: `a:pdel:${p.id}` },
  ]);
  return {
    text: lines.join("\n"),
    markup: { inline_keyboard: [[{ text: "➕ Add post", callback_data: "a:padd" }], ...rows, backRow] },
  };

}

/* -------------------------------- callbacks ------------------------------- */

export async function handleAdminCallback(
  callbackId: string,
  chatId: number,
  messageId: number,
  userId: number | undefined,
  data: string,
): Promise<void> {
  if (!(await isAdmin(userId))) {
    await answerCallback(callbackId, "Admins only.");
    return;
  }

  const [, action = "", ...rest] = data.split(":");
  const arg = rest.join(":");

  const show = async (section: { text: string; markup: unknown }) => {
    await answerCallback(callbackId);
    await editMessage(chatId, messageId, section.text, section.markup);
  };

  switch (action) {
    case "home":
      return show({ text: ADMIN_PANEL, markup: adminKeyboard() });
    case "top":
      return show(await topSection());
    case "stats":
      return show(await statsSection());
    case "ads":
      return show(await adsSection());
    case "reports":
      return show(await reportsSection());
    case "fc":
      return show(await forcedSection());
    case "sp":
      return show(await sponsorSection());
    case "posts":
      return show(await postsSection());
    case "spclr":
      await setSetting(SPONSOR_KEY, "");
      return show(await sponsorSection());
    case "pdel":
      await deletePost(arg);
      return show(await postsSection());
    case "spset":
      await setState(userId!, "sponsor_set");
      await answerCallback(callbackId);
      await sendMessage(
        chatId,
        [
          "💠 Send the sponsor block. HTML is supported, so hidden links work:",
          '<code>&lt;b&gt;Sponsored&lt;/b&gt;\n&lt;a href="https://example.com"&gt;🔥 Play Slots&lt;/a&gt;</code>',
          "",
          "/cancel to abort.",
        ].join("\n"),
      );
      return;
    case "padd":
      await setState(userId!, "post_add");
      await answerCallback(callbackId);
      await sendMessage(
        chatId,
        [
          "🗂 Send the post as up to 3 lines:",
          "<code>Post text\nhttps://full-post-link (optional)\nhttps://image-url (optional)</code>",
          "",
          "/cancel to abort.",
        ].join("\n"),
      );
      return;
    case "tt": {
      const added = await toggleFeatured(arg);
      await answerCallback(callbackId, added ? "Added to Top 10" : "Removed / limit reached");
      return show(await topSection());
    }
    case "adel":
      await deleteAd(arg);
      return show(await adsSection());
    case "rres":
      await resolveReport(arg);
      return show(await reportsSection());
    case "fcdel":
      await deleteForcedChannel(arg);
      return show(await forcedSection());
    case "aadd":
      await setState(userId!, "ad_add");
      await answerCallback(callbackId);
      await sendMessage(
        chatId,
        "📣 Send the ad in 3 lines:\n<code>Title\nBody text\nhttps://link (optional)</code>\n\nSend /cancel to abort.",
      );
      return;
    case "fcadd":
      await setState(userId!, "fc_add");
      await answerCallback(callbackId);
      await sendMessage(chatId, "🔗 Send the channel username (e.g. <code>@mychannel</code>).\n\n/cancel to abort.");
      return;
    case "bc":
      await setState(userId!, "broadcast");
      await answerCallback(callbackId);
      await sendMessage(
        chatId,
        "📢 Send the message to broadcast now (text, photo, links, formatting — all supported).\n\n/cancel to abort.",
      );
      return;
    default:
      await answerCallback(callbackId);
  }
}

/* ------------------------------ pending states ----------------------------- */

interface IncomingMessage {
  chat: { id: number };
  message_id: number;
  from?: { id?: number };
  text?: string;
}

/** Returns true when the message was consumed by an admin flow. */
export async function handleAdminState(
  state: PendingState,
  message: IncomingMessage,
): Promise<boolean> {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const text = (message.text ?? "").trim();

  if (text === "/cancel") {
    if (userId) await clearState(userId);
    await sendMessage(chatId, "Cancelled.", adminKeyboard());
    return true;
  }

  if (state.action === "ad_add") {
    const [title, body, url] = text.split("\n").map((l) => l.trim());
    if (!title || !body) {
      await sendMessage(chatId, "Need at least a title line and a body line. Try again or /cancel.");
      if (userId) await setState(userId, "ad_add");
      return true;
    }
    await addAd(title, body, url || null);
    await sendMessage(chatId, "✅ Ad saved.", adminKeyboard());
    return true;
  }

  if (state.action === "fc_add") {
    const username = text.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "").trim();
    if (!/^[A-Za-z0-9_]{4,}$/.test(username)) {
      await sendMessage(chatId, "That doesn't look like a channel username. Try again or /cancel.");
      if (userId) await setState(userId, "fc_add");
      return true;
    }
    await addForcedChannel(username, null);
    await sendMessage(chatId, `✅ @${username} added to forced join.`, adminKeyboard());
    return true;
  }

  if (state.action === "sponsor_set") {
    if (text.length < 3) {
      await sendMessage(chatId, "That looks empty. Try again or /cancel.");
      if (userId) await setState(userId, "sponsor_set");
      return true;
    }
    await setSetting(SPONSOR_KEY, text);
    await sendMessage(chatId, "✅ Sponsor block updated.", adminKeyboard());
    return true;
  }

  if (state.action === "post_add") {
    const [body, link, image] = text.split("\n").map((l) => l.trim());
    if (!body || body.length < 3) {
      await sendMessage(chatId, "Need at least a body line. Try again or /cancel.");
      if (userId) await setState(userId, "post_add");
      return true;
    }
    await addPost(body, link || null, image || null);
    await sendMessage(chatId, "✅ Post saved.", adminKeyboard());
    return true;
  }

  if (state.action === "broadcast") {
    await sendMessage(chatId, "📢 Broadcasting…");
    const ids = await activeUserIds();
    let sent = 0;
    let failed = 0;
    for (const id of ids) {
      const ok = await copyMessage(id, chatId, message.message_id);
      if (ok) sent += 1;
      else {
        failed += 1;
        await deactivateUser(id);
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    if (userId) await recordBroadcast(userId, chatId, message.message_id, sent, failed);
    await sendMessage(chatId, `✅ Broadcast done.\nSent: <b>${sent}</b>\nFailed: <b>${failed}</b>`, adminKeyboard());
    return true;
  }

  return false;
}

/* ------------------------------- forced join ------------------------------- */

export interface JoinGate {
  ok: boolean;
  text?: string;
  markup?: unknown;
}

export async function checkForcedJoin(userId: number | undefined): Promise<JoinGate> {
  if (!userId) return { ok: true };
  const channels = await forcedChannels();
  if (channels.length === 0) return { ok: true };

  const missing: typeof channels = [];
  for (const channel of channels) {
    const res = (await callTelegramSafe("getChatMember", {
      chat_id: `@${channel.username}`,
      user_id: userId,
    })) as { result?: { status?: string } } | null;
    const status = res?.result?.status;
    if (!status || ["left", "kicked"].includes(status)) missing.push(channel);
  }

  if (missing.length === 0) return { ok: true };

  return {
    ok: false,
    text: [
      "🔒 <b>Join required</b>",
      "",
      "Please join the channel(s) below to keep using Comb Search Bot, then tap <b>I joined</b>.",
    ].join("\n"),
    markup: {
      inline_keyboard: [
        ...missing.map((c) => [{ text: `📢 Join @${c.username}`, url: `https://t.me/${c.username}` }]),
        [{ text: "✅ I joined", callback_data: "join:check" }],
      ],
    },
  };
}
