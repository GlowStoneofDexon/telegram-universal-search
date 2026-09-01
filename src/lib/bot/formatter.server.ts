import { CATEGORIES, categoryLabel } from "./categories";
import type { SearchResult } from "./types";

const TYPE_EMOJI: Record<string, string> = {
  message: "💬",
  channel: "📢",
  group: "👥",
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

function sponsoredBlock(ad?: AdBlock | null): string {
  if (!ad) return DEFAULT_SPONSORED;
  const lines = ["──────────────", "<b>Sponsored</b>", `<b>${escapeHtml(ad.title)}</b>`, escapeHtml(ad.body)];
  if (ad.url) lines.push(`<a href="${escapeHtml(ad.url)}">Open ▸</a>`);
  return lines.join("\n");
}

const PAGE_SIZE = 10;

export function formatResults(
  results: SearchResult[],
  query: string,
  category: string,
  cached: boolean,
  ad?: AdBlock | null,
): string {
  const page = results.slice(0, PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const lines: string[] = [];


  lines.push(
    `🔍 <b>Results for “${escapeHtml(query)}”</b> · ${escapeHtml(categoryLabel(category))} · Page 1/${pages}${cached ? " · cached" : ""}`,
  );
  lines.push("");

  page.forEach((result, index) => {
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

    if (result.snippet) {
      const clean = result.snippet.replace(/\s+/g, " ").trim();
      const trimmed = clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
      if (trimmed) lines.push(`   <i>${escapeHtml(trimmed)}</i>`);
    }

    if (result.username && result.messageId) {
      lines.push(
        `   <a href="https://t.me/${escapeHtml(result.username)}/${result.messageId}">Open message</a>`,
      );
    }
    lines.push("");
  });

  lines.push(sponsoredBlock(ad));

  return lines.join("\n").trim();
}

export function formatNoResults(query: string, category: string): string {
  return [
    `🔍 <b>Results for “${escapeHtml(query)}”</b> · ${escapeHtml(categoryLabel(category))}`,
    "",
    "No public matches found.",
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

export function categoryKeyboard(query: string) {
  // Callback data is capped at 64 bytes by Telegram, so the query is trimmed.
  const safeQuery = query.slice(0, 40);
  const buttons = CATEGORIES.map((c) => ({
    text: `${c.emoji} ${c.label}`,
    callback_data: `f:${c.id}:${safeQuery}`,
  }));

  return {
    inline_keyboard: [buttons.slice(0, 3), buttons.slice(3, 6), buttons.slice(6)],
  };
}

export const WELCOME = [
  "🔍 <b>Comb Search Bot</b>",
  "",
  "Search public Telegram content in real time — channels, groups, chats, files, videos, audios and links.",
  "",
  "<b>Just send me a keyword.</b> No commands needed — type <code>anime</code>, <code>crypto</code>, anything.",
  "",
  "Then tap a category button under the results to switch between Channels, Groups, Files, Videos, Audios and Links.",
].join("\n");

