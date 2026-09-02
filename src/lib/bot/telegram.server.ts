import { createHash, timingSafeEqual } from "node:crypto";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const telegramKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!telegramKey) throw new Error("TELEGRAM_API_KEY is not configured");
  return { lovableKey, telegramKey };
}

// ✅ UPDATED: Now reads TELEGRAM_WEBHOOK_SECRET directly instead of deriving from TELEGRAM_API_KEY
export function deriveWebhookSecret(): string {
  const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
  if (!secret) {
    throw new Error(
      "TELEGRAM_WEBHOOK_SECRET is not configured. Please set it in your environment variables."
    );
  }
  return secret;
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function callTelegram(
  method: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const { lovableKey, telegramKey } = credentials();

  const response = await fetch(`${GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Telegram ${method} failed [${response.status}]: ${body}`);
    throw new Error(`Telegram ${method} failed [${response.status}]: ${body}`);
  }

  const data = (await response.json()) as { ok?: boolean; error_code?: number; description?: string };
  if (data.ok === false) {
    console.error(`Telegram ${method} returned error: ${data.description}`);
    throw new Error(`Telegram ${method} error: ${data.description}`);
  }
  return data;
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: unknown,
): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function editMessage(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: unknown,
): Promise<void> {
  await callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerCallback(callbackId: string, text?: string): Promise<void> {
  await callTelegram("answerCallbackQuery", {
    callback_query_id: callbackId,
    ...(text ? { text } : {}),
  });
}

/** Like callTelegram but returns null instead of throwing. */
export async function callTelegramSafe(
  method: string,
  payload: Record<string, unknown>,
): Promise<unknown | null> {
  try {
    return await callTelegram(method, payload);
  } catch {
    return null;
  }
}

/** Copies any message (text, photo, links, entities) to a chat. */
export async function copyMessage(
  chatId: number,
  fromChatId: number,
  messageId: number,
): Promise<boolean> {
  const res = await callTelegramSafe("copyMessage", {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
  return res !== null;
}

/** Sends a photo with caption; falls back to a plain message when it fails. */
export async function sendPhoto(
  chatId: number,
  photo: string,
  caption: string,
  replyMarkup?: unknown,
): Promise<boolean> {
  const res = await callTelegramSafe("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return res !== null;
}

/** Swaps only the inline keyboard of an existing message. */
export async function editMarkup(
  chatId: number,
  messageId: number,
  replyMarkup: unknown,
): Promise<void> {
  await callTelegramSafe("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup,
  });
}
