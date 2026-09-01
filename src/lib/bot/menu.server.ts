/* Reply keyboard menu + static texts for Comb Search Bot. */

export const MENU_HELP = "❓ Help";
export const MENU_PRIVACY = "📝 Privacy and Terms";
export const MENU_LANGUAGE = "🗣️ Language";
export const MENU_PROMOTE = "📈 Promote";

export const MENU_LABELS = [MENU_HELP, MENU_PRIVACY, MENU_LANGUAGE, MENU_PROMOTE];

/** Two-column reply keyboard. `one_time_keyboard` hides it once used/typing. */
export const MAIN_MENU = {
  keyboard: [
    [{ text: MENU_HELP }, { text: MENU_PRIVACY }],
    [{ text: MENU_LANGUAGE }, { text: MENU_PROMOTE }],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
  is_persistent: false,
  input_field_placeholder: "Send a keyword to search Telegram…",
};

export const HELP_TEXT = [
  "❓ <b>How to use Comb Search Bot</b>",
  "",
  "1️⃣ Just send any keyword — no command needed. Example: <code>anime</code>",
  "2️⃣ Tap a category button under the results to switch between Chats, Channels, Groups, Files, Videos, Audios and Links.",
  "3️⃣ Tap a result title to open it directly in Telegram.",
  "",
  "<b>Commands</b>",
  "🚀 /start — start the bot",
  "🎲 /rand — get 10 random bots",
  "⚠️ /report — report a problem or ask for help",
  "ℹ️ /about — about this bot",
  "🔐 /admin — admin panel (restricted)",
  "",
  "Searches are limited to a few per minute to keep the bot fast for everyone.",
].join("\n");

export const PRIVACY_TEXT = [
  "📝 <b>Privacy and Terms</b>",
  "",
  "1️⃣ This bot collects your Telegram user ID to identify unique users.",
  "2️⃣ The bot will not record your personal search history.",
  "3️⃣ Due to the restrictions of the Telegram Bot API, we cannot access your mobile number and IP address.",
  "4️⃣ Any groups or channels linked to by this bot are provided by others, and we are not responsible for the legality of the links you get from this bot, even if it is marked with ✅.",
  "5️⃣ If you abuse this bot, we might ban you.",
].join("\n");

export const ABOUT_TEXT = [
  "ℹ️ <b>About Comb Search Bot</b>",
  "",
  "Comb Search Bot is a free universal search engine for public Telegram content — channels, groups, chats, files, videos, audios and links.",
  "",
  "• 100% free, no subscription",
  "• Real-time public search",
  "• No personal search history stored",
  "",
  "Website: https://combsearchbot.lovable.app",
].join("\n");

export function promoteMessage(): { text: string; markup: unknown } {
  const miniApp = process.env["BOT_PROMOTE_URL"] ?? "https://t.me/CombSearchBot";
  return {
    text: [
      "📈 <b>Promote your channel, group or brand</b>",
      "",
      "Reach thousands of Telegram users searching every day.",
      "",
      "• Sponsored slot under every search result",
      "• Featured keyword placement",
      "• Custom broadcast campaigns",
      "",
      "Tap below to get started.",
    ].join("\n"),
    markup: {
      inline_keyboard: [[{ text: "💼 Business Mini App", url: miniApp }]],
    },
  };
}

export const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "hi", flag: "🇮🇳", label: "हिन्दी" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "id", flag: "🇮🇩", label: "Indonesia" },
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "uk", flag: "🇺🇦", label: "Українська" },
  { code: "bn", flag: "🇧🇩", label: "বাংলা" },
] as const;

export function languageKeyboard() {
  const buttons = LANGUAGES.map((l) => ({
    text: `${l.flag} ${l.label}`,
    callback_data: `lang:${l.code}`,
  }));
  const rows: (typeof buttons)[] = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  return { inline_keyboard: rows };
}

export function languageLabel(code: string): string {
  const found = LANGUAGES.find((l) => l.code === code);
  return found ? `${found.flag} ${found.label}` : code;
}

export const LANGUAGE_PROMPT = [
  "🗣️ <b>Choose your language</b>",
  "",
  "Search works in every language — this sets the bot interface preference.",
].join("\n");
