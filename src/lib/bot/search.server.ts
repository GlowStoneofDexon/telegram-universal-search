import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SearchOutcome, SearchResult } from "./types";

const CACHE_DAYS = 7;
const CACHE_LIMIT = 50;
const WORKER_LIMIT = 50;

interface CacheRow {
  channel_name: string | null;
  channel_username: string | null;
  message_text: string | null;
  member_count: number;
  content_type: string | null;
  link: string | null;
  message_id: number | null;
  created_at: string;
}

function rowToResult(row: CacheRow): SearchResult {
  return {
    type: row.content_type ?? "message",
    title: row.channel_name ?? "Unknown",
    username: row.channel_username,
    snippet: row.message_text ?? "",
    link: row.link,
    date: row.created_at,
    members: row.member_count ?? 0,
    messageId: row.message_id,
  };
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

async function readCache(
  query: string,
  category: string,
  freshOnly: boolean,
): Promise<SearchResult[]> {
  let builder = supabaseAdmin
    .from("search_cache")
    .select(
      "channel_name, channel_username, message_text, member_count, content_type, link, message_id, created_at",
    )
    .eq("search_query", normalizeQuery(query))
    .eq("category", category);

  if (freshOnly) builder = builder.gte("expires_at", new Date().toISOString());

  const { data, error } = await builder
    .order("created_at", { ascending: false })
    .limit(CACHE_LIMIT);

  if (error) {
    console.error("Cache read error:", error.message);
    return [];
  }
  return (data ?? []).map((row) => rowToResult(row as CacheRow));
}

async function writeCache(
  query: string,
  category: string,
  results: SearchResult[],
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const normalized = normalizeQuery(query);

  await supabaseAdmin
    .from("search_cache")
    .delete()
    .eq("search_query", normalized)
    .eq("category", category);

  const { error } = await supabaseAdmin.from("search_cache").insert(
    results.map((result) => ({
      search_query: normalized,
      category,
      channel_name: result.title,
      channel_username: result.username,
      message_text: result.snippet,
      member_count: result.members ?? 0,
      content_type: result.type,
      link: result.link,
      message_id: result.messageId,
      expires_at: expiresAt,
    })),
  );

  if (error) console.error("Cache write error:", error.message);
}

async function callWorker(query: string, category: string): Promise<SearchResult[]> {
  const workerUrl = process.env["MTPROTO_WORKER_URL"];
  const workerSecret = process.env["MTPROTO_WORKER_SECRET"];

  if (!workerUrl) throw new Error("Search engine is not configured yet (MTPROTO_WORKER_URL).");
  if (!workerSecret) throw new Error("Search engine credentials are missing.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${workerUrl.replace(/\/$/, "")}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerSecret}`,
      },
      body: JSON.stringify({ query, category, limit: WORKER_LIMIT }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Worker search request failed:", error);
    throw new Error("The search engine took too long to answer. Try again in a moment.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error(`Worker search failed [${response.status}]: ${body}`);
    if (response.status === 429) throw new Error("Telegram rate limit reached. Try again shortly.");
    throw new Error("The search engine is temporarily unavailable.");
  }

  const data = (await response.json()) as { results?: SearchResult[] };
  return data.results ?? [];
}

export async function search(query: string, category: string): Promise<SearchOutcome> {
  const fresh = await readCache(query, category, true);
  if (fresh.length > 0) {
    return { results: fresh, cached: true };
  }

  try {
    const results = await callWorker(query, category);
    if (results.length > 0) {
      await writeCache(query, category, results);
    }
    return { results, cached: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stale = await readCache(query, category, false);
    if (stale.length > 0) {
      return { results: stale, cached: true };
    }
    return { results: [], cached: false, error: message };
  }
}

export async function cleanupCache(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("delete_expired_cache");
  if (error) {
    console.error("Cache cleanup error:", error.message);
    return 0;
  }
  return (data as number | null) ?? 0;
}
