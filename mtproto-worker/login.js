// One-time interactive login. Run locally:  npm install && npm run login
// It prints a session string. Store it as TELEGRAM_SESSION on the worker host.
// Never commit it, never share it.

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const rl = readline.createInterface({ input, output });

async function main() {
  console.log("Telegram session generator (Comb Search Bot)\n");
  console.log("Create an app at https://my.telegram.org/apps to get api_id and api_hash.\n");

  const apiId = parseInt(process.env.TELEGRAM_API_ID ?? (await rl.question("API ID: ")), 10);
  const apiHash = process.env.TELEGRAM_API_HASH ?? (await rl.question("API hash: "));

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await rl.question("Phone number (with country code): "),
    phoneCode: async () => await rl.question("Login code: "),
    password: async () => await rl.question("2FA password (blank if none): "),
    onError: (err) => console.error("Login error:", err?.message ?? err),
  });

  const session = client.session.save();
  console.log("\nLogin successful. Session string:\n");
  console.log("=".repeat(60));
  console.log(session);
  console.log("=".repeat(60));
  console.log("\nSave it as TELEGRAM_SESSION on your worker host. Keep it secret.\n");

  await client.disconnect();
  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  rl.close();
  process.exit(1);
});
