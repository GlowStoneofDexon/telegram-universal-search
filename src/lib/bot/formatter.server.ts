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

export function formatResults(
  results: SearchResult[],
  query: string,
  category: string,
  cached: boolean,
): string {
  const lines: string[] = [];
  lines.push(`🔍 <b>${escapeHtml(query)}</b> — ${escapeHtml(categoryLabel(category))}`);
  lines.push(`${results.length} result${results.length === 1 ? "" : "s"}${cached ? " · cached" : ""}`);
  lines.push("");

  results.slice(0, 10).forEach((result, index) => {
    const emoji = TYPE_EMOJI[result.type] ?? "📌";
    lines.push(`<b>${index + 1}.</b> ${emoji} <b>${escapeHtml(result.title)}</b>`);

    const meta: string[] = [];
    if (result.username) meta.push(`@${escapeHtml(result.username)}`);
    if (result.members > 0) meta.push(`👥 ${formatMembers(result.members)}`);
    if (meta.length) lines.push(`   ${meta.join(" · ")}`);

    if (result.snippet) {
      const trimmed =
        result.snippet.length > 160 ? `${result.snippet.slice(0, 160)}…` : result.snippet;
      lines.push(`   <i>${escapeHtml(trimmed.replace(/\s+/g, " "))}</i>`);
    }

    const links: string[] = [];
    if (result.username) {
      const user = escapeHtml(result.username);
      links.push(`<a href="https://t.me/${user}">Open chat</a>`);
      if (result.messageId) {
        links.push(`<a href="https://t.me/${user}/${result.messageId}">Open message</a>`);
      }
    } else if (result.link) {
      links.push(`<a href="https://${escapeHtml(result.link)}">Open in Telegram</a>`);
    }
    if (links.length) lines.push(`   ${links.join(" · ")}`);
    lines.push("");
  });


  return lines.join("\n").trim();
}

export function formatNoResults(query: string, category: string): string {
  return [
    `🔍 <b>${escapeHtml(query)}</b> — ${escapeHtml(categoryLabel(category))}`,
    "",
    "No public matches found.",
    "",
    "Try another category below, a shorter keyword, or different spelling.",
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
  "Just send me any keyword to start.",
  "",
  "<b>Commands</b>",
  "/search &lt;query&gt; — search chats",
  "/channels &lt;query&gt;",
  "/groups &lt;query&gt;",
  "/files &lt;query&gt;",
  "/videos &lt;query&gt;",
  "/audios &lt;query&gt;",
  "/links &lt;query&gt;",
  "/help — show this message",
].join("\n");
