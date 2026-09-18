export const CATEGORIES = [
  { id: "all", label: "All", emoji: "🔍" },
  { id: "channels", label: "Anime Channels", emoji: "📢" },
  { id: "groups", label: "Anime Groups", emoji: "👥" },
  { id: "bots", label: "Bots", emoji: "🤖" },
  { id: "chats", label: "Chats", emoji: "💬" },
  { id: "photos", label: "Fan Art / Scans", emoji: "🖼" },
  { id: "videos", label: "Episodes", emoji: "🎬" },
  { id: "audios", label: "OSTs / AMVs", emoji: "🎵" },
  { id: "files", label: "Manga / Files", emoji: "📄" },
  { id: "links", label: "Links", emoji: "🔗" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as readonly string[];

export function isCategory(value: string): value is CategoryId {
  return CATEGORY_IDS.includes(value);
}

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryEmoji(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.emoji ?? "📌";
}
