import { createFileRoute, Link } from "@tanstack/react-router";

import { BOT_URL, Prose, SiteFooter, SiteHeader } from "@/components/site-chrome";

const TITLE = "How Telegram Search Really Works (And What It Misses)";
const DESCRIPTION =
  "Telegram's in-app search only covers chats you joined and exact usernames. Here is how global Telegram search works and how to search public channels, groups and files by keyword.";
const URL = "https://combsearchbot.lovable.app/blog/telegram-search";

export const Route = createFileRoute("/blog/telegram-search")({
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
              Telegram search feels broken the first time you need something specific. You type a
              topic into the app's search bar and get a handful of your own chats plus a couple of
              username matches — not the wider public Telegram you know exists.
            </p>

            <h2>What in-app search actually covers</h2>
            <ul className="space-y-2">
              <li>Messages inside chats, groups and channels you have already joined.</li>
              <li>Contacts and usernames that match your query closely.</li>
              <li>A small set of public chats Telegram surfaces for popular exact terms.</li>
            </ul>
            <p>
              It does <strong>not</strong> reliably search message text across public channels you
              have never joined. That gap is why "telegram search" is such a common query.
            </p>

            <h2>How global search works</h2>
            <p>
              Telegram's client API exposes a global search over public content. A search bot signs
              in as a regular client, issues that query on your behalf and returns the matches with
              their source chat. That is exactly what{" "}
              <a href={BOT_URL}>@CombSearchBot</a> does: your keyword goes out, the results come
              back, and nothing about you is kept.
            </p>

            <h2>Search categories reference</h2>
            <ul className="space-y-2">
              <li>
                <strong>/channels keyword</strong> — public broadcast channels.
              </li>
              <li>
                <strong>/groups keyword</strong> — public discussion groups.
              </li>
              <li>
                <strong>/search keyword</strong> — message text across public chats.
              </li>
              <li>
                <strong>/files</strong>, <strong>/videos</strong>, <strong>/audios</strong>,{" "}
                <strong>/links</strong> — filter by media type.
              </li>
            </ul>

            <h2>Tips that improve results</h2>
            <ul className="space-y-2">
              <li>Use two or three words, not a sentence — the index matches phrases, not intent.</li>
              <li>Try the singular and the native-language spelling of the topic.</li>
              <li>Switch categories on the same keyword; a topic often lives in groups, not channels.</li>
            </ul>

            <h2>Next</h2>
            <p>
              Ready to try it? Read{" "}
              <Link to="/blog/how-to-find-telegram-channels">how to find Telegram channels</Link>{" "}
              step by step, or see{" "}
              <Link to="/" hash="result-examples">
                what a result looks like
              </Link>
              .
            </p>
          </Prose>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
