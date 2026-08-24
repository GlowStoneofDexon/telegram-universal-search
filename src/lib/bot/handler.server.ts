import { isCategory } from "./categories";
import {
  WELCOME,
  categoryKeyboard,
  formatError,
  formatNoResults,
  formatResults,
} from "./formatter.server";
import { checkRateLimit, rateLimitMessage } from "./rate-limit.server";
import { search } from "./search.server";
import { answerCallback, editMessage, sendMessage } from "./telegram.server";

const COMMAND_CATEGORIES: Record<string, string> = {
  "/search": "chats",
  "/chats": "chats",
  "/channels": "channels",
  "/groups": "groups",
  "/files": "files",
  "/videos": "videos",
  "/audios": "audios",
  "/audio": "audios",
  "/links": "links",
};

interface TelegramUpdate {
  message?: {
    chat?: { id?: number };
    from?: { id?: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id?: number };
    message?: { chat?: { id?: number }; message_id?: number };
  };
}


async function renderSearch(query: string, category: string) {
  const outcome = await search(query, category);
  if (outcome.error) {
    return formatError(query, outcome.error);
  }
  return outcome.results.length > 0
    ? formatResults(outcome.results, query, category, outcome.cached)
    : formatNoResults(query, category);
}

async function handleMessage(chatId: number, userId: number | undefined, rawText: string) {
  const text = rawText.trim();

  if (text.startsWith("/")) {
    const [commandToken, ...rest] = text.split(/\s+/);
    const command = (commandToken ?? "").split("@")[0]!.toLowerCase();
    const query = rest.join(" ").trim();

    if (command === "/start" || command === "/help") {
      await sendMessage(chatId, WELCOME);
      return;
    }

    const category = COMMAND_CATEGORIES[command];
    if (!category) {
      // Unknown command — treat the whole thing as a keyword instead of nagging.
      const fallback = text.replace(/^\//, "").trim();
      if (fallback.length < 2) {
        await sendMessage(chatId, "Send me any keyword to search Telegram.");
        return;
      }
      const fallbackLimit = await checkRateLimit(userId);
      if (!fallbackLimit.allowed) {
        await sendMessage(chatId, rateLimitMessage(fallbackLimit.retryAfter));
        return;
      }
      await sendMessage(
        chatId,
        await renderSearch(fallback, "chats"),
        categoryKeyboard(fallback),
      );
      return;
    }
    if (query.length < 2) {
      await sendMessage(chatId, "Just send me a keyword — no command needed. Example: <code>anime</code>");
      return;
    }


    const limit = await checkRateLimit(userId);
    if (!limit.allowed) {
      await sendMessage(chatId, rateLimitMessage(limit.retryAfter));
      return;
    }

    await sendMessage(chatId, await renderSearch(query, category), categoryKeyboard(query));
    return;
  }

  if (text.length < 2) {
    await sendMessage(chatId, "Please send a keyword with at least 2 characters.");
    return;
  }

  const limit = await checkRateLimit(userId);
  if (!limit.allowed) {
    await sendMessage(chatId, rateLimitMessage(limit.retryAfter));
    return;
  }

  await sendMessage(chatId, await renderSearch(text, "chats"), categoryKeyboard(text));
}

async function handleCallback(update: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = update.message?.chat?.id;
  const messageId = update.message?.message_id;
  const data = update.data ?? "";

  if (!chatId || !messageId || !data.startsWith("f:")) {
    await answerCallback(update.id);
    return;
  }

  const [, category = "", ...queryParts] = data.split(":");
  const query = queryParts.join(":").trim();

  if (!isCategory(category) || query.length < 2) {
    await answerCallback(update.id, "That search expired. Send the keyword again.");
    return;
  }

  const limit = await checkRateLimit(update.from?.id);
  if (!limit.allowed) {
    await answerCallback(
      update.id,
      `Too many searches. Try again in ${Math.max(1, limit.retryAfter)}s.`,
    );
    return;
  }

  await answerCallback(update.id, `Searching ${category}…`);
  await editMessage(chatId, messageId, await renderSearch(query, category), categoryKeyboard(query));
}

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return;
    }

    const chatId = update.message?.chat?.id;
    const text = update.message?.text;
    if (chatId && typeof text === "string") {
      await handleMessage(chatId, update.message?.from?.id, text);
    }

  } catch (error) {
    console.error("Update handling failed:", error);
  }
}
