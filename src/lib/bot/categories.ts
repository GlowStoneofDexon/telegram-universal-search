export const CATEGORIES = [
  { id: "chats", label: "Chats", emoji: "💬" },
  { id: "channels", label: "Channels", emoji: "📢" },
  { id: "groups", label: "Groups", emoji: "👥" },
  { id: "files", label: "Files", emoji: "📄" },
  { id: "videos", label: "Videos", emoji: "🎬" },
  { id: "audios", label: "Audios", emoji: "🎵" },
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
