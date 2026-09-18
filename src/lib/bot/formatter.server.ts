import { CATEGORIES, categoryLabel } from "./categories";
import type { SearchResult } from "./types";

const TYPE_EMOJI: Record<string, string> = {
  message: "💬",
  channel: "📢",
  group: "👥",
  bot: "🤖",
  file: "📄",
  video: "🎬",
  audio: "🎵",
  link: "🔗",
  photo: "🖼️",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMembers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

const DEFAULT_SPONSORED = [
  "──────────────",
  "<b>Sponsored</b>",
  "🔥 Play Slots · ⚽ Bet Football",
  "💰 100% crypto bonus",
].join("\n");

export interface AdBlock {
  title: string;
  body: string;
  url: string | null;
}

/**
 * Sponsor text set by an admin wins (it is raw HTML so hidden links work),
 * then the ad rotation, then the built-in default.
 */
function sponsoredBlock(ad?: AdBlock | null, sponsorText?: string | null): string {
  if (sponsorText && sponsorText.trim()) {
    return ["──────────────", sponsorText.trim()].join("\n");
  }
  if (!ad) return DEFAULT_SPONSORED;
  const lines = ["──────────────", "<b>Sponsored</b>", `<b>${escapeHtml(ad.title)}</b>`, escapeHtml(ad.body)];
  if (ad.url) lines.push(`<a href="${escapeHtml(ad.url)}">Open ▸</a>`);
  return lines.join("\n");
}

export const PAGE_SIZE = 10;

export interface RenderOptions {
  page?: number;
  ad?: AdBlock | null;
  sponsorText?: string | null;
}

export function formatResults(
  results: SearchResult[],
  query: string,
  category: string,
  cached: boolean,
  options: RenderOptions = {},
): string {
  const page = Math.max(0, options.page ?? 0);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const slice = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const lines: string[] = [];

  lines.push(
    `🔍 <b>Results for “${escapeHtml(query)}”</b> · ${escapeHtml(categoryLabel(category))} · Page ${page + 1}/${pages}${cached ? " · cached" : ""}`,
  );
  lines.push("");

  slice.forEach((result, index) => {
    const emoji = TYPE_EMOJI[result.type] ?? "📌";
    const title = escapeHtml(result.title);
    const heading = result.username
      ? `<a href="https://t.me/${escapeHtml(result.username)}">${title}</a>`
      : title;
    lines.push(`<b>${page * PAGE_SIZE + index + 1}.</b> ${emoji} <b>${heading}</b>`);

    const meta: string[] = [];
    if (result.members > 0) meta.push(`👥 ${formatMembers(result.members)} members`);
    if (result.username) meta.push(`@${escapeHtml(result.username)}`);
    if (meta.length) lines.push(`   ${meta.join(" · ")}`);

    if (result.snippet) {
      const clean = result.snippet.replace(/\s+/g, " ").trim();
      const trimmed = clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
      if (trimmed) lines.push(`   <i>${escapeHtml(trimmed)}</i>`);
    }

    if (result.username && result.messageId) {
      lines.push(
        `   <a href="https://t.me/${escapeHtml(result.username)}/${result.messageId}">Open ▸</a>`,
      );
    }
    lines.push("");
  });

  lines.push(sponsoredBlock(options.ad, options.sponsorText));

  return lines.join("\n").trim();
}

export function formatNoResults(query: string, category: string): string {
  return [
    `🔍 <b>Results for “${escapeHtml(query)}”</b> · ${escapeHtml(categoryLabel(category))}`,
    "",
    "No public matches found.",
    "",
    "ℹ️ This bot only searches <b>anime, manga, manhwa and donghua</b> content — try another title or check the spelling.",
    "",
    "Tap another category below, or try a shorter keyword.",
  ].join("\n");
}

export function formatError(query: string, reason: string): string {
  return [
    `⚠️ <b>Search failed</b> for “${escapeHtml(query)}”`,
    "",
    escapeHtml(reason),
    "",
    "Please try again in a moment.",
  ].join("\n");
}

interface Button {
  text: string;
  callback_data: string;
}

/**
 * Icon filter row(s) + pagination row.
 * Active category is hidden and replaced by an "All" reset button.
 * Page 0 shows a single Next arrow; deeper pages expand to First/Prev/Next.
 */
export function categoryKeyboard(query: string, category = "all", page = 0, totalPages = 1) {
  const safeQuery = query.slice(0, 30);
  const cb = (cat: string, pageIndex: number) => `f:${cat}:${pageIndex}:${safeQuery}`;

  const buttons: Button[] = [];
  if (category !== "all") buttons.push({ text: "🌐 All", callback_data: cb("all", 0) });
  for (const c of CATEGORIES) {
    if (c.id === category || c.id === "all") continue;
    buttons.push({ text: c.emoji, callback_data: cb(c.id, 0) });
  }

  const rows: Button[][] = [];
  for (let i = 0; i < buttons.length; i += 5) rows.push(buttons.slice(i, i + 5));

  const nav: Button[] = [];
  if (page > 0) {
    nav.push({ text: "⏮", callback_data: cb(category, 0) });
    nav.push({ text: "◀️", callback_data: cb(category, page - 1) });
  }
  if (page + 1 < totalPages) nav.push({ text: "➡️ Next", callback_data: cb(category, page + 1) });
  if (nav.length) rows.push(nav);

  return { inline_keyboard: rows };
}

export const WELCOME = [
  "🍥 <b>Search Otaku Bot</b>",
  "",
  "Search Telegram for <b>anime, manga, manhwa and donghua</b> — channels, groups, episodes, scans, OSTs and fan communities.",
  "",
  "<b>Just send a title.</b> No commands needed — try <code>One Piece</code>, <code>Jujutsu Kaisen</code>, <code>Solo Leveling</code>.",
  "",
  "Then tap a category icon under the results to filter, and the arrow to page through more finds.",
].join("\n");

/** Compact list used by /rand (saved anime finds, no query header). */
export function formatRandom(results: SearchResult[]): string {
  const lines = ["🎲 <b>10 random anime finds</b>", ""];

  results.forEach((result, index) => {
    const emoji = TYPE_EMOJI[result.type] ?? "📌";
    const title = escapeHtml(result.title);
    const heading = result.username
      ? `<a href="https://t.me/${escapeHtml(result.username)}">${title}</a>`
      : title;
    lines.push(`<b>${index + 1}.</b> ${emoji} <b>${heading}</b>`);

    const meta: string[] = [];
    if (result.members > 0) meta.push(`👥 ${formatMembers(result.members)} members`);
    if (result.username) meta.push(`@${escapeHtml(result.username)}`);
    if (meta.length) lines.push(`   ${meta.join(" · ")}`);
    lines.push("");
  });

  lines.push("Send any anime or manga title to search for more.");
  return lines.join("\n").trim();
}
