import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      // ✅ ADD THIS: Telegram probes the URL with GET/HEAD
      GET: async () => {
        return new Response("Webhook endpoint is ready", { status: 200 });
      },

      POST: async ({ request }) => {
        const { deriveWebhookSecret, safeEqual } = await import("@/lib/bot/telegram.server");

        // Accept an explicitly configured webhook secret (set via setWebhook by
        // hand) and fall back to the connector-derived one.
        const accepted: string[] = [];
        const explicit = process.env["TELEGRAM_WEBHOOK_SECRET"];
        if (explicit) accepted.push(explicit);
        try {
          accepted.push(deriveWebhookSecret());
        } catch (error) {
          if (accepted.length === 0) {
            console.error("Webhook misconfigured:", error);
            return new Response("Not configured", { status: 500 });
          }
        }

        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!accepted.some((secret) => safeEqual(provided, secret))) {
          return new Response("Unauthorized", { status: 401 });
        }

        let update: unknown;
        try {
          update = await request.json();
        } catch {
          return Response.json({ ok: true, ignored: true });
        }

        const { handleUpdate } = await import("@/lib/bot/handler.server");
        await handleUpdate(update as never);

        return Response.json({ ok: true });
      },
    },
  },
});
