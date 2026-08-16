import { createHash, timingSafeEqual } from "node:crypto";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const telegramKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!telegramKey) throw new Error("TELEGRAM_API_KEY is not configured");
  return { lovableKey, telegramKey };
}

export function deriveWebhookSecret(): string {
  const { telegramKey } = credentials();
  return createHash("sha256").update(`telegram-webhook:${telegramKey}`).digest("base64url");
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
