import { createFileRoute } from "@tanstack/react-router";

/** Bearer-protected: queue a search job without needing the service-role key. */
export const Route = createFileRoute("/api/public/worker/seed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MTPROTO_WORKER_SECRET"];
        if (!secret) return new Response("Not configured", { status: 500 });
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { query?: string; category?: string; limit_count?: number };
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!body.query) return new Response("Missing query", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("search_jobs").insert({
          query: body.query,
          category: body.category ?? "all",
          limit_count: body.limit_count ?? 50,
        });

        if (error) {
          console.error("seed insert failed:", error.message);
          return new Response("Queue error", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
