import { createFileRoute } from "@tanstack/react-router";

/**
 * The Android (Termux) worker polls this endpoint for pending searches.
 * Only outgoing requests are needed on the device, so no public address,
 * tunnel or port forwarding is required.
 */
export const Route = createFileRoute("/api/public/worker/claim")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MTPROTO_WORKER_SECRET"];
        if (!secret) return new Response("Not configured", { status: 500 });
        if (request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("claim_search_job");
        if (error) {
          console.error("claim_search_job failed:", error.message);
          return new Response("Queue error", { status: 500 });
        }

        const job = (data as { id: string; query: string; category: string; limit_count: number }[] | null)?.[0];
        if (!job) return Response.json({ job: null });

        return Response.json({
          job: {
            id: job.id,
            query: job.query,
            category: job.category,
            limit: job.limit_count,
          },
        });
      },
    },
  },
});
