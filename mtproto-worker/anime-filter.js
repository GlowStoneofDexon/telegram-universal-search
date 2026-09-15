// Scope of the bot. Add more words here later to widen what the bot returns.
export const ALLOWED_TERMS = [
  "anime",
  "animé",
  "manga",
  "manhwa",
  "manhua",
  "donghua",
  "dhongua",
  "webtoon",
  "otaku",
  "weeb",
  "subbed",
  "dubbed",
  "sub indo",
  "ova",
  "amv",
  "waifu",
  "isekai",
  "shounen",
  "shonen",
  "shoujo",
  "seinen",
  "hentai",
  "light novel",
  "anime movie",
  "animation",
];

const HAYSTACK_KEYS = ["title", "username", "snippet"];

function normalize(value) {
  return String(value ?? "").toLowerCase();
}

/** True when the text mentions anything inside the allowed scope. */
export function inScope(text) {
  const haystack = normalize(text);
  return ALLOWED_TERMS.some((term) => haystack.includes(term));
}

/** Widen a user query so it stays inside the bot's scope. */
export function scopedQuery(query) {
  return inScope(query) ? query : `${query} anime`;
}

/** Keep only results that belong to the bot's scope. */
export function filterResults(results, query) {
  const queryInScope = inScope(query);
  return results.filter((result) => {
    if (queryInScope) return true;
    return HAYSTACK_KEYS.some((key) => inScope(result[key]));
  });
}
