import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface BotUser {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language: string;
}

export async function touchUser(
  telegramId: number | undefined,
  username?: string | null,
  firstName?: string | null,
): Promise<void> {
  if (!telegramId) return;
  const { error } = await supabaseAdmin.from("bot_users").upsert(
    {
      telegram_id: telegramId,
      username: username ?? null,
      first_name: firstName ?? null,
      is_active: true,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "telegram_id" },
  );
  if (error) console.error("touchUser failed:", error.message);
}

export async function setUserLanguage(telegramId: number, language: string): Promise<void> {
  await supabaseAdmin
    .from("bot_users")
    .upsert({ telegram_id: telegramId, language }, { onConflict: "telegram_id" });
}

export async function logSearch(
  telegramId: number | undefined,
  query: string,
  category: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from("bot_search_log").insert({
    telegram_id: telegramId ?? null,
    query: query.trim().toLowerCase(),
    category,
  });
  if (error) console.error("logSearch failed:", error.message);
}

/* ---------------------------------- admin --------------------------------- */

export async function isAdmin(telegramId: number | undefined): Promise<boolean> {
  if (!telegramId) return false;

  const envAdmins = (process.env["BOT_ADMIN_IDS"] ?? "")
    .split(/[,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (envAdmins.includes(String(telegramId))) return true;

  const { data } = await supabaseAdmin
    .from("bot_admins")
    .select("telegram_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  return Boolean(data);
}

export interface PendingState {
  action: string;
  payload: Record<string, unknown>;
}

export async function setState(
  telegramId: number,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await supabaseAdmin
    .from("bot_admin_state")
    .upsert(
      { telegram_id: telegramId, action, payload, updated_at: new Date().toISOString() },
      { onConflict: "telegram_id" },
    );
}

export async function takeState(telegramId: number | undefined): Promise<PendingState | null> {
  if (!telegramId) return null;
  const { data } = await supabaseAdmin
    .from("bot_admin_state")
    .select("action, payload")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (!data) return null;
  await supabaseAdmin.from("bot_admin_state").delete().eq("telegram_id", telegramId);
  return {
    action: data.action as string,
    payload: (data.payload ?? {}) as Record<string, unknown>,
  };
}

export async function clearState(telegramId: number): Promise<void> {
  await supabaseAdmin.from("bot_admin_state").delete().eq("telegram_id", telegramId);
}

/* ----------------------------------- ads ---------------------------------- */

export interface BotAd {
  id: string;
  title: string;
  body: string;
  url: string | null;
  is_active: boolean;
}

export async function activeAd(): Promise<BotAd | null> {
  const { data } = await supabaseAdmin
    .from("bot_ads")
    .select("id, title, body, url, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as BotAd | undefined) ?? null;
}

export async function listAds(): Promise<BotAd[]> {
  const { data } = await supabaseAdmin
    .from("bot_ads")
    .select("id, title, body, url, is_active")
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as BotAd[];
}

export async function addAd(title: string, body: string, url: string | null): Promise<void> {
  await supabaseAdmin.from("bot_ads").insert({ title, body, url });
}

export async function deleteAd(id: string): Promise<void> {
  await supabaseAdmin.from("bot_ads").delete().eq("id", id);
}

/* --------------------------------- reports -------------------------------- */

export interface BotReport {
  id: string;
  telegram_id: number | null;
  username: string | null;
  message: string;
  status: string;
  created_at: string;
}

export async function addReport(
  telegramId: number | undefined,
  username: string | null,
  message: string,
): Promise<void> {
  await supabaseAdmin
    .from("bot_reports")
    .insert({ telegram_id: telegramId ?? null, username, message });
}

export async function listReports(): Promise<BotReport[]> {
  const { data } = await supabaseAdmin
    .from("bot_reports")
    .select("id, telegram_id, username, message, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as BotReport[];
}

export async function resolveReport(id: string): Promise<void> {
  await supabaseAdmin.from("bot_reports").update({ status: "closed" }).eq("id", id);
}

/* -------------------------------- statistics ------------------------------- */

export interface BotStats {
  users: number;
  activeToday: number;
  searches: number;
  searchesToday: number;
  reports: number;
}

async function count(table: string, apply?: (q: any) => any): Promise<number> {
  let q = supabaseAdmin.from(table as never).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: n } = await q;
  return n ?? 0;
}

export async function stats(): Promise<BotStats> {
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [users, activeToday, searches, searchesToday, reports] = await Promise.all([
    count("bot_users"),
    count("bot_users", (q) => q.gte("last_seen", dayAgo)),
    count("bot_search_log"),
    count("bot_search_log", (q) => q.gte("created_at", dayAgo)),
    count("bot_reports", (q) => q.eq("status", "open")),
  ]);
  return { users, activeToday, searches, searchesToday, reports };
}

/* ------------------------------ top searches ------------------------------ */

export interface TopSearch {
  query: string;
  hits: number;
}

export async function topSearches(limit = 20): Promise<TopSearch[]> {
  const { data, error } = await supabaseAdmin.rpc("bot_top_searches", {
    _days: 30,
    _limit: limit,
  });
  if (error) {
    console.error("topSearches failed:", error.message);
    return [];
  }
  return (data ?? []) as TopSearch[];
}

export async function featuredSearches(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("bot_featured_searches")
    .select("query")
    .order("position", { ascending: true })
    .limit(10);
  return (data ?? []).map((row) => row.query as string);
}

export async function toggleFeatured(query: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("bot_featured_searches")
    .select("id")
    .eq("query", query)
    .maybeSingle();

  if (data) {
    await supabaseAdmin.from("bot_featured_searches").delete().eq("query", query);
    return false;
  }

  const current = await featuredSearches();
  if (current.length >= 10) return false;
  await supabaseAdmin
    .from("bot_featured_searches")
    .insert({ query, position: current.length });
  return true;
}

/* --------------------------- forced join channels -------------------------- */

export interface ForcedChannel {
  id: string;
  username: string;
  title: string | null;
}

export async function forcedChannels(): Promise<ForcedChannel[]> {
  const { data } = await supabaseAdmin
    .from("bot_forced_channels")
    .select("id, username, title")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as ForcedChannel[];
}

export async function addForcedChannel(username: string, title: string | null): Promise<void> {
  await supabaseAdmin
    .from("bot_forced_channels")
    .upsert({ username, title, is_active: true }, { onConflict: "username" });
}

export async function deleteForcedChannel(id: string): Promise<void> {
  await supabaseAdmin.from("bot_forced_channels").delete().eq("id", id);
}

/* -------------------------------- broadcast -------------------------------- */

export async function activeUserIds(): Promise<number[]> {
  const { data } = await supabaseAdmin
    .from("bot_users")
    .select("telegram_id")
    .eq("is_active", true)
    .limit(10000);
  return (data ?? []).map((row) => Number(row.telegram_id));
}

export async function deactivateUser(telegramId: number): Promise<void> {
  await supabaseAdmin.from("bot_users").update({ is_active: false }).eq("telegram_id", telegramId);
}

export async function recordBroadcast(
  sentBy: number,
  fromChatId: number,
  messageId: number,
  sent: number,
  failed: number,
): Promise<void> {
  await supabaseAdmin.from("bot_broadcasts").insert({
    sent_by: sentBy,
    from_chat_id: fromChatId,
    message_id: messageId,
    sent_count: sent,
    failed_count: failed,
  });
}
