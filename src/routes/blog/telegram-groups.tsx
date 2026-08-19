import { createFileRoute, Link } from "@tanstack/react-router";

import { BOT_URL, Prose, SiteFooter, SiteHeader } from "@/components/site-chrome";

const TITLE = "How to Find Active Telegram Groups by Keyword";
const DESCRIPTION =
  "Search public Telegram groups by topic and learn the signals that separate live communities from abandoned ones.";
const URL = "https://combsearchbot.lovable.app/blog/telegram-groups";

export const Route = createFileRoute("/blog/telegram-groups")({
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
              Groups are where Telegram conversations actually happen — support chats, city
              communities, trading rooms, study circles. Unlike channels, anyone can post, which
              makes picking the right one more important.
            </p>

            <h2>Run the search</h2>
            <p>
              Send your topic to <a href={BOT_URL}>@CombSearchBot</a> and tap{" "}
              <strong>👥 Groups</strong>, or type <strong>/groups berlin flatshare</strong> directly.
              Results list the group title, @username and member count, with a link that opens the
              group in Telegram.
            </p>

            <h2>Signals of a live group</h2>
            <ul className="space-y-2">
              <li>
                <strong>Mid-size membership.</strong> 500–50,000 members usually means real
                conversation; six-figure "groups" are often spam farms.
              </li>
              <li>
                <strong>Fresh matched messages.</strong> The snippet comes from a real post — open
                it and check the date.
              </li>
              <li>
                <strong>Named admins and rules.</strong> Pinned rules mean moderation exists.
              </li>
            </ul>

            <h2>Avoid the obvious traps</h2>
            <p>
              Skip groups whose only content is invite links, and never send payment details in a
              chat you joined minutes ago. If a group looks thin, search the same keyword in{" "}
              <Link to="/blog/telegram-channels">channels</Link> instead — the channel often hosts
              the real community and links its official group.
            </p>

            <h2>Related</h2>
            <p>
              <Link to="/blog/telegram-search">How Telegram search works</Link> ·{" "}
              <Link to="/blog/how-to-find-telegram-channels">
                Step-by-step channel finder guide
              </Link>
            </p>
          </Prose>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
