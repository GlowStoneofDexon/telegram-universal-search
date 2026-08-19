import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";

const TITLE = "Telegram Search Guides — Comb Search Bot";
const DESCRIPTION =
  "Guides on searching Telegram: how global search works, how to find channels by keyword, and how to find active public groups.";
const URL = "https://combsearchbot.lovable.app/blog";

export const POSTS = [
  {
    to: "/blog/telegram-search",
    title: "How Telegram search really works (and what it misses)",
    excerpt:
      "Why in-app search only covers chats you joined, and how global search bots reach public content across Telegram.",
  },
  {
    to: "/blog/telegram-channels",
    title: "How to find Telegram channels worth following",
    excerpt:
      "A keyword-first method for discovering public channels by topic, plus how to judge quality before you join.",
  },
  {
    to: "/blog/telegram-groups",
    title: "How to find active Telegram groups",
    excerpt:
      "Search public groups by keyword, read the signals that separate live communities from dead ones.",
  },
  {
    to: "/blog/how-to-find-telegram-channels",
    title: "How to find Telegram channels: step-by-step",
    excerpt: "The three-step walkthrough, with a worked example and the commands to copy.",
  },
] as const;

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});

function BlogIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Telegram search guides</h1>
        <p className="mt-3 text-muted-foreground">
          Practical walkthroughs for finding channels, groups and files on Telegram.
        </p>
        <div className="mt-10 space-y-4">
          {POSTS.map((post) => (
            <Link
              key={post.to}
              to={post.to}
              className="block rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent"
            >
              <h2 className="font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
