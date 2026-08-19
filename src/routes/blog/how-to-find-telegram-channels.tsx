import { createFileRoute, Link } from "@tanstack/react-router";

import { BOT_URL, Prose, SiteFooter, SiteHeader } from "@/components/site-chrome";

const TITLE = "How to Find Telegram Channels: Step-by-Step Guide";
const DESCRIPTION =
  "Three steps to find any public Telegram channel by keyword, with a worked example, the exact commands, and how to open results directly in Telegram.";
const URL = "https://combsearchbot.lovable.app/blog/how-to-find-telegram-channels";

const STEPS = [
  {
    name: "Open the search bot",
    text: "Open @CombSearchBot in Telegram and tap Start. There is no sign-up and nothing to install.",
  },
  {
    name: "Send your keyword",
    text: "Send a two or three word topic, for example 'photography tutorials'. The bot searches public Telegram content globally.",
  },
  {
    name: "Filter by category",
    text: "Tap the Channels button to keep only broadcast channels, then open any result with its Open chat link.",
  },
];

export const Route = createFileRoute("/blog/how-to-find-telegram-channels")({
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
          "@type": "HowTo",
          name: TITLE,
          description: DESCRIPTION,
          step: STEPS.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.name,
            text: step.text,
          })),
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
              Telegram has no channel directory, and the in-app search bar mostly returns chats you
              already joined. Here is the fastest reliable method, using a free{" "}
              <a href={BOT_URL}>Telegram channel finder</a> bot.
            </p>

            <h2>The three steps</h2>
            <ol className="space-y-3">
              {STEPS.map((step, index) => (
                <li key={step.name} className="ml-5 list-decimal">
                  <strong>{step.name}.</strong> {step.text}
                </li>
              ))}
            </ol>

            <h2>Worked example: "photography"</h2>
            <p>
              Send <strong>photography</strong>, tap <strong>📢 Channels</strong>, and the bot
              replies with up to ten channels — each with a title, @username, member count and a
              snippet from the matched message. Tap <strong>Open chat</strong> to preview a channel
              before joining, or <strong>Open message</strong> to jump to the exact post.{" "}
              <Link to="/" hash="result-examples">
                See an example result
              </Link>
              .
            </p>

            <h2>Commands you can copy</h2>
            <ul className="space-y-2">
              <li>
                <strong>/channels photography</strong> — channels only
              </li>
              <li>
                <strong>/groups photography</strong> — public groups
              </li>
              <li>
                <strong>/videos photography</strong> — video posts
              </li>
            </ul>

            <h2>If you get no results</h2>
            <ul className="space-y-2">
              <li>Shorten the keyword to its core noun.</li>
              <li>Try the local-language spelling for regional topics.</li>
              <li>
                Switch category — many topics live in{" "}
                <Link to="/blog/telegram-groups">groups</Link> rather than channels.
              </li>
            </ul>
            <p>
              More background:{" "}
              <Link to="/blog/telegram-search">how Telegram search works</Link> and{" "}
              <Link to="/blog/telegram-channels">picking channels worth following</Link>. Full FAQ
              on the <Link to="/" hash="faq">home page</Link>.
            </p>
          </Prose>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
