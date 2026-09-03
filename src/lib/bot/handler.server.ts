import {
  ADMIN_PANEL,
  adminKeyboard,
  checkForcedJoin,
  handleAdminCallback,
  handleAdminState,
} from "./admin.server";
import { isCategory } from "./categories";
import {
  PAGE_SIZE,
  WELCOME,
  categoryKeyboard,
  formatError,
  formatNoResults,
  formatResults,
  type AdBlock,
} from "./formatter.server";
import {
  activeAd,
  featuredSearches,
  isAdmin,
  logSearch,
  setUserLanguage,
  takeState,
  touchUser,
  addReport,
  setState,
  sponsorText,
} from "./db.server";
import {
  ABOUT_TEXT,
  HELP_TEXT,
  LANGUAGE_PROMPT,
  MAIN_MENU,
  MENU_HELP,
  MENU_LANGUAGE,
  MENU_PRIVACY,
  MENU_PROMOTE,
  PRIVACY_TEXT,
  languageKeyboard,
  languageLabel,
  promoteMessage,
} from "./menu.server";
import { handlePostCallback, sendRandomPost } from "./posts.server";
import { checkRateLimit, rateLimitMessage } from "./rate-limit.server";
import { search } from "./search.server";
import { answerCallback, editMessage, sendMessage } from "./telegram.server";

const COMMAND_CATEGORIES: Record<string, string> = {
  "/search": "all",
  "/all": "all",
  "/chats": "chats",
  "/channels": "channels",
  "/groups": "groups",
  "/bots": "bots",
  "/photos": "photos",
  "/files": "files",
  "/videos": "videos",
  "/audios": "audios",
  "/audio": "audios",
  "/links": "links",
};

const RANDOM_SEEDS = [
  "downloader bot",
  "ai bot",
  "movie bot",
  "music bot",
  "sticker bot",
  "anime bot",
  "crypto bot",
  "study bot",
  "tools bot",
  "game bot",
];

interface TelegramMessage {
  chat: { id: number };
  message_id: number;
  from?: { id?: number; username?: string; first_name?: string };
  text?: string;
}

interface TelegramUpdate {
  message?: Partial<TelegramMessage> & { chat?: { id?: number } };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id?: number };
    message?: { chat?: { id?: number }; message_id?: number };
  };
}

async function currentAd(): Promise<AdBlock | null> {
  const ad = await activeAd();
  return ad ? { title: ad.title, body: ad.body, url: ad.url } : null;
}

async function renderSearch(query: string, category: string, page: number, userId?: number) {
  const [outcome, ad, sponsor] = await Promise.all([search(query, category), currentAd(), sponsorText()]);
  if (page === 0) void logSearch(userId, query, category);

  if (outcome.error) {
    return { text: formatError(query, outcome.error), markup: categoryKeyboard(query, category) };
  }
  if (outcome.results.length === 0) {
    return { text: formatNoResults(query, category), markup: categoryKeyboard(query, category) };
  }

  const totalPages = Math.max(1, Math.ceil(outcome.results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  return {
    text: formatResults(outcome.results, query, category, outcome.cached, {
      page: safePage,
      ad,
      sponsorText: sponsor,
    }),
    markup: categoryKeyboard(query, category, safePage, totalPages),
  };
}

async function runSearch(
  chatId: number,
  userId: number | undefined,
  query: string,
  category: string,
  page = 0,
) {
  const limit = await checkRateLimit(userId);
  if (!limit.allowed) {
    await sendMessage(chatId, rateLimitMessage(limit.retryAfter));
    return;
  }
  const { text, markup } = await renderSearch(query, category, page, userId);
  await sendMessage(chatId, text, markup);
}

async function sendStart(chatId: number) {
  const featured = await featuredSearches();
  const extra =
    featured.length > 0
      ? `\n\n🔝 <b>Trending searches</b>\n${featured.map((q, i) => `${i + 1}. <code>${q}</code>`).join("\n")}`
      : "";
  await sendMessage(chatId, `${WELCOME}${extra}`, MAIN_MENU);
}

async function handleCommand(message: TelegramMessage, command: string, query: string) {
  const chatId = message.chat.id;
  const userId = message.from?.id;

  switch (command) {
    case "/start":
      await sendStart(chatId);
      return true;
    case "/help":
      await sendMessage(chatId, HELP_TEXT, MAIN_MENU);
      return true;
    case "/about":
      await sendMessage(chatId, ABOUT_TEXT, MAIN_MENU);
      return true;
    case "/privacy":
      await sendMessage(chatId, PRIVACY_TEXT, MAIN_MENU);
      return true;
    case "/menu":
      await sendMessage(chatId, "Choose an option:", MAIN_MENU);
      return true;
    case "/language":
      await sendMessage(chatId, LANGUAGE_PROMPT, languageKeyboard());
      return true;
    case "/report": {
      if (query.length >= 3) {
        await addReport(userId, message.from?.username ?? null, query);
        await sendMessage(chatId, "✅ Thanks — your report was sent to the admins.");
        return true;
      }
      if (userId) await setState(userId, "report");
      await sendMessage(chatId, "⚠️ Describe the problem in one message and I'll pass it to the admins.\n\n/cancel to abort.");
      return true;
    }
    case "/rand": {
      const seed = RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)]!;
      await sendMessage(chatId, "🎲 Picking 10 random bots…");
      await runSearch(chatId, userId, seed, "bots");
      return true;
    }
    case "/admin": {
      if (!(await isAdmin(userId))) {
        await sendMessage(chatId, "🔐 This command is restricted to admins.");
        return true;
      }
      await sendMessage(chatId, ADMIN_PANEL, adminKeyboard());
      return true;
    }
    case "/posts":
      await sendRandomPost(chatId);
      return true;
    case "/cancel":
      await sendMessage(chatId, "Nothing to cancel.");
      return true;
    default:
      return false;
  }
}

async function handleMenuLabel(chatId: number, text: string): Promise<boolean> {
  switch (text) {
    case MENU_HELP:
      await sendMessage(chatId, HELP_TEXT, MAIN_MENU);
      return true;
    case MENU_PRIVACY:
      await sendMessage(chatId, PRIVACY_TEXT, MAIN_MENU);
      return true;
    case MENU_LANGUAGE:
      await sendMessage(chatId, LANGUAGE_PROMPT, languageKeyboard());
      return true;
    case MENU_PROMOTE: {
      const { text: body, markup } = promoteMessage();
      await sendMessage(chatId, body, markup);
      return true;
    }
    default:
      return false;
  }
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const text = (message.text ?? "").trim();

  void touchUser(userId, message.from?.username ?? null, message.from?.first_name ?? null);

  // Pending multi-step flows (admin inputs, reports) take priority.
  const state = await takeState(userId);
  if (state) {
    if (state.action === "report") {
      if (text === "/cancel") {
        await sendMessage(chatId, "Cancelled.");
        return;
      }
      await addReport(userId, message.from?.username ?? null, text);
      await sendMessage(chatId, "✅ Thanks — your report was sent to the admins.");
      return;
    }
    if (await handleAdminState(state, message)) return;
  }

  if (await handleMenuLabel(chatId, text)) return;

  const gate = await checkForcedJoin(userId);
  if (!gate.ok && !text.startsWith("/start")) {
    await sendMessage(chatId, gate.text!, gate.markup);
    return;
  }

  if (text.startsWith("/")) {
    const [commandToken, ...rest] = text.split(/\s+/);
    const command = (commandToken ?? "").split("@")[0]!.toLowerCase();
    const query = rest.join(" ").trim();

    if (await handleCommand(message, command, query)) return;

    const category = COMMAND_CATEGORIES[command];
    if (category) {
      if (query.length < 2) {
        await sendMessage(chatId, "Just send me a keyword — no command needed. Example: <code>anime</code>");
        return;
      }
      await runSearch(chatId, userId, query, category);
      return;
    }

    // Unknown command — treat it as a keyword.
    const fallback = text.replace(/^\//, "").trim();
    if (fallback.length < 2) {
      await sendMessage(chatId, "Send me any keyword to search Telegram.", MAIN_MENU);
      return;
    }
    await runSearch(chatId, userId, fallback, "all");
    return;
  }

  if (text.length < 2) {
    await sendMessage(chatId, "Please send a keyword with at least 2 characters.");
    return;
  }

  await runSearch(chatId, userId, text, "all");
}

async function handleCallback(update: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = update.message?.chat?.id;
  const messageId = update.message?.message_id;
  const data = update.data ?? "";
  const userId = update.from?.id;

  if (!chatId || !messageId) {
    await answerCallback(update.id);
    return;
  }

  if (data.startsWith("po:")) {
    await handlePostCallback(update.id, chatId, messageId, userId, data);
    return;
  }

  if (data.startsWith("a:")) {
    await handleAdminCallback(update.id, chatId, messageId, userId, data);
    return;
  }

  if (data.startsWith("lang:")) {
    const code = data.slice(5);
    if (userId) await setUserLanguage(userId, code);
    await answerCallback(update.id, "Language updated");
    await editMessage(chatId, messageId, `🗣️ Language set to <b>${languageLabel(code)}</b>.`);
    return;
  }

  if (data === "join:check") {
    const gate = await checkForcedJoin(userId);
    if (gate.ok) {
      await answerCallback(update.id, "Thanks! You're in.");
      await editMessage(chatId, messageId, "✅ All set — send me any keyword to search.");
    } else {
      await answerCallback(update.id, "Still not joined to all channels.");
    }
    return;
  }

  if (!data.startsWith("f:")) {
    await answerCallback(update.id);
    return;
  }

  const [, category = "", pageToken = "0", ...queryParts] = data.split(":");
  const query = queryParts.join(":").trim();
  const page = Number.parseInt(pageToken, 10) || 0;

  if (!isCategory(category) || query.length < 2) {
    await answerCallback(update.id, "That search expired. Send the keyword again.");
    return;
  }

  const limit = await checkRateLimit(userId);
  if (!limit.allowed) {
    await answerCallback(update.id, `Too many searches. Try again in ${Math.max(1, limit.retryAfter)}s.`);
    return;
  }

  await answerCallback(update.id, "Loading…");
  const { text, markup } = await renderSearch(query, category, page, userId);
  await editMessage(chatId, messageId, text, markup);
}

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return;
    }

    const chatId = update.message?.chat?.id;
    const messageId = update.message?.message_id;
    if (chatId && messageId) {
      await handleMessage({ ...(update.message as TelegramMessage), chat: { id: chatId }, message_id: messageId });
    }
  } catch (error) {
    console.error("Update handling failed:", error);
  }
}
