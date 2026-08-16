import { createFileRoute } from "@tanstack/react-router";

// Called by a scheduled job to drop expired cache rows.
export const Route = createFileRoute("/api/public/telegram/cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { cleanupCache } = await import("@/lib/bot/search.server");
        const deleted = await cleanupCache();
        return Response.json({ ok: true, deleted });
      },
    },
  },
});
