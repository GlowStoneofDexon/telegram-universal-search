import { createFileRoute, Link } from "@tanstack/react-router";

import { BOT_URL, Prose, SiteFooter, SiteHeader } from "@/components/site-chrome";

const TITLE = "How to Find Telegram Channels Worth Following";
const DESCRIPTION =
  "A keyword-first method for discovering public Telegram channels by topic, and the signals that tell you whether a channel is worth joining.";
const URL = "https://combsearchbot.lovable.app/blog/telegram-channels";

export const Route = createFileRoute("/blog/telegram-channels")({
  component: Post,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
});

function Post() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <article>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">{TITLE}</h1>
          <Prose>
            <p className="mt-5">
              Telegram channels are one-way feeds: news desks, job boards, release trackers, study
              notes. There is no official directory, so most people find them through screenshots
              and forwarded links. Keyword search is faster.
            </p>

            <h2>Search by topic, not by name</h2>
            <p>
              Send your topic to <a href={BOT_URL}>@CombSearchBot</a> and tap <strong>📢 Channels</strong>.
              Channel names rarely match what you would type, so search the subject ("solidity
              audits", "kdrama subs") rather than a guessed username.
            </p>

            <h2>Judge a channel before joining</h2>
            <ul className="space-y-2">
              <li>
                <strong>Member count</strong> — shown next to every result. Tiny counts on broad
                topics usually mean a re-post mirror.
              </li>
              <li>
                <strong>Snippet</strong> — the matched message text tells you the tone and language.
              </li>
              <li>
                <strong>Recency</strong> — open the linked message; if the last post is months old,
                move on.
              </li>
            </ul>

            <h2>Widen the net</h2>
            <p>
              Run the same keyword through <Link to="/blog/telegram-groups">groups</Link> as well —
              discussion communities often point to the best channels in their pinned messages. And
              if a topic returns nothing, read{" "}
              <Link to="/blog/telegram-search">how Telegram search works</Link> for the phrasing
              tricks that fix most empty results.
            </p>

            <h2>Copy-paste commands</h2>
            <ul className="space-y-2">
              <li>
                <strong>/channels machine learning</strong>
              </li>
              <li>
                <strong>/channels remote jobs</strong>
              </li>
              <li>
                <strong>/files annual report</strong>
              </li>
            </ul>
            <p>
              See <Link to="/" hash="result-examples">an example result</Link> before you start.
            </p>
          </Prose>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
