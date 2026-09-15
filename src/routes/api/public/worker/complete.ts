import { createFileRoute } from "@tanstack/react-router";

/** The Termux worker posts finished search results back here. */
export const Route = createFileRoute("/api/public/worker/complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MTPROTO_WORKER_SECRET"];
        if (!secret) return new Response("Not configured", { status: 500 });
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { id?: string; results?: unknown[]; error?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!body.id) return new Response("Missing id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("search_jobs")
          .update({
            status: body.error ? "failed" : "done",
            results: (body.results ?? []) as never,
            error: body.error ?? null,
            completed_at: new Date().toISOString(),
          })
          .eq("id", body.id);

        if (error) {
          console.error("complete job failed:", error.message);
          return new Response("Queue error", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
