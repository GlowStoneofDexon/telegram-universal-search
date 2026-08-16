import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { deriveWebhookSecret, safeEqual } = await import("@/lib/bot/telegram.server");

        let expected: string;
        try {
          expected = deriveWebhookSecret();
        } catch (error) {
          console.error("Webhook misconfigured:", error);
          return new Response("Not configured", { status: 500 });
        }

        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, expected)) {
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
