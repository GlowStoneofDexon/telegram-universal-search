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

const JOB_TIMEOUT_MS = 55_000;
const JOB_POLL_MS = 700;

/**
 * The search engine runs on the owner's Android tablet (Termux) and only makes
 * outgoing requests, so searches are handed over through a job queue instead of
 * calling the device directly.
 */
async function callWorker(query: string, category: string): Promise<SearchResult[]> {
  const { data: job, error } = await supabaseAdmin
    .from("search_jobs")
    .insert({ query, category, limit_count: WORKER_LIMIT })
    .select("id")
    .single();

  if (error || !job) {
    console.error("Failed to queue search job:", error?.message);
    throw new Error("The search engine is temporarily unavailable.");
  }

  const deadline = Date.now() + JOB_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_MS));

    const { data: row } = await supabaseAdmin
      .from("search_jobs")
      .select("status, results, error")
      .eq("id", job.id)
      .maybeSingle();

    if (!row) continue;
    if (row.status === "done") return (row.results ?? []) as unknown as SearchResult[];
    if (row.status === "failed") {
      const message = String(row.error ?? "");
      if (/FLOOD_WAIT/i.test(message)) {
        throw new Error("Telegram rate limit reached. Try again shortly.");
      }
      throw new Error("The search engine is temporarily unavailable.");
    }
  }

  await supabaseAdmin
    .from("search_jobs")
    .update({ status: "expired" })
    .eq("id", job.id)
    .eq("status", "pending");

  throw new Error("The search engine is offline right now. Please try again in a moment.");
}

/** Channels an admin has permanently banned from results. */
const BLOCKED_USERNAMES = new Set(["ipweb", "diskwalaofficial", "txspan_info"]);

function removeBlocked(results: SearchResult[]): SearchResult[] {
  return results.filter(
    (result) => !BLOCKED_USERNAMES.has((result.username ?? "").replace(/^@/, "").toLowerCase()),
  );
}

export async function search(query: string, category: string): Promise<SearchOutcome> {
  const fresh = removeBlocked(await readCache(query, category, true));
  if (fresh.length > 0) {
    return { results: fresh, cached: true };
  }

  try {
    const results = removeBlocked(await callWorker(query, category));
    if (results.length > 0) {
      await writeCache(query, category, results);
    }
    return { results, cached: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stale = removeBlocked(await readCache(query, category, false));
    if (stale.length > 0) {
      return { results: stale, cached: true };
    }
    return { results: [], cached: false, error: message };
  }
}

export async function cleanupCache(): Promise<number> {
  await supabaseAdmin.rpc("cleanup_search_jobs");
  const { data, error } = await supabaseAdmin.rpc("delete_expired_cache");
  if (error) {
    console.error("Cache cleanup error:", error.message);
    return 0;
  }
  return (data as number | null) ?? 0;
}
