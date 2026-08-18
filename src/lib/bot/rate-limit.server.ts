import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MAX_REQUESTS = 12;
const WINDOW_SECONDS = 60;

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfter: number;
}

/**
 * Per-Telegram-user throttle. Fails open: if the backend check errors we let
 * the search through rather than breaking the bot.
 */
export async function checkRateLimit(userId: number | undefined): Promise<RateLimitVerdict> {
  if (!userId) return { allowed: true, retryAfter: 0 };

  const { data, error } = await supabaseAdmin.rpc("check_bot_rate_limit", {
    _user_id: userId,
    _max_requests: MAX_REQUESTS,
    _window_seconds: WINDOW_SECONDS,
  });

  if (error) {
    console.error("Rate limit check failed:", error.message);
    return { allowed: true, retryAfter: 0 };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: boolean; retry_after?: number }
    | null
    | undefined;

  return {
    allowed: row?.allowed !== false,
    retryAfter: row?.retry_after ?? WINDOW_SECONDS,
  };
}

export function rateLimitMessage(retryAfter: number): string {
  return [
    "🐢 <b>Slow down a little</b>",
    "",
    `You've hit the search limit (${MAX_REQUESTS} searches per minute).`,
    `Please try again in ${Math.max(1, retryAfter)} second${retryAfter === 1 ? "" : "s"}.`,
  ].join("\n");
}
