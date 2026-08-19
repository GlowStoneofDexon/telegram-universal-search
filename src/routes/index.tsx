import { createFileRoute, Link } from "@tanstack/react-router";

import { BOT_URL, SiteFooter, SiteHeader } from "@/components/site-chrome";

const TITLE = "Telegram Search: Find Channels, Groups & Files — Comb Search Bot";
const DESCRIPTION =
  "Free Telegram search bot. Search public channels, groups, chats, files, videos and audios by keyword and open every match directly in Telegram.";
const URL = "https://combsearchbot.lovable.app/";

const FAQS = [
  {
    q: "How do I find Telegram channels by keyword?",
    a: "Open @CombSearchBot in Telegram, send any keyword, then tap the 📢 Channels button. The bot runs a global search over public Telegram content and returns up to 10 matching channels with their @username, member count and a direct t.me link. See a worked example in our guide to finding Telegram channels.",
    link: { to: "/blog/how-to-find-telegram-channels", label: "How to find Telegram channels" },
  },
  {
    q: "Is Comb Search Bot a free Telegram channel finder?",
    a: "Yes. It is 100% free, has no ads, no sign-up and no paid tier. It stores nothing about you: searches are passed through to Telegram and only anonymous result snippets are cached briefly to keep repeat searches fast.",
    link: { to: "/blog/telegram-channels", label: "Telegram channels explained" },
  },
  {
    q: "Can I search Telegram groups the same way?",
    a: "Yes. Send your keyword and tap 👥 Groups, or use the /groups command directly (for example /groups photography). Results show public group titles, usernames and member counts so you can judge size before joining.",
    link: { to: "/blog/telegram-groups", label: "Finding Telegram groups" },
  },
  {
    q: "Why does Telegram's own search miss so much?",
    a: "Telegram's in-app search mainly covers chats you have already joined plus exact username matches. A global search bot queries public content across Telegram, so partial keywords and message text surface too.",
    link: { to: "/blog/telegram-search", label: "How Telegram search works" },
  },
  {
    q: "Can I search for files, videos and audio?",
    a: "Yes — the 📄 Files, 🎬 Videos and 🎵 Audios categories filter results to public messages that contain that media type, and each result links straight to the original message in Telegram.",
    link: { to: "/blog/telegram-search", label: "Search categories reference" },
  },
  {
    q: "Are there any limits?",
    a: "Each user gets 12 searches per minute to keep the bot responsive and to respect Telegram's own rate limits. If you hit it, the bot tells you exactly how many seconds to wait.",
    link: null,
  },
] as const;

const CATEGORIES = [
  { emoji: "📢", label: "Channels", desc: "Public broadcast channels by topic or name." },
  { emoji: "👥", label: "Groups", desc: "Public discussion groups and communities." },
  { emoji: "💬", label: "Chats", desc: "Message text matches across public chats." },
  { emoji: "📄", label: "Files", desc: "Documents shared in public messages." },
  { emoji: "🎬", label: "Videos", desc: "Public video posts matching your keyword." },
  { emoji: "🎵", label: "Audios", desc: "Music and audio files posted publicly." },
] as const;

export const Route = createFileRoute("/")({
  component: Landing,
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Telegram search bot
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Search all of public Telegram from one keyword
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Comb Search Bot is a free Telegram channel finder and global search engine. Send a
            keyword, pick a category, and open every match directly in Telegram — no account, no
            ads, nothing stored about you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={BOT_URL}
              className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start searching on Telegram
            </a>
            <Link
              to="/blog/how-to-find-telegram-channels"
              className="rounded-md border border-border px-5 py-2.5 font-medium transition-colors hover:bg-accent"
            >
              How to find channels
            </Link>
          </div>
        </section>

        <section className="border-t border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Six ways to filter a search</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="rounded-lg border border-border bg-card p-5">
                <div aria-hidden className="text-2xl">
                  {c.emoji}
                </div>
                <h3 className="mt-3 font-semibold">{c.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">What a result looks like</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every match includes the channel title, its @username, member count, a text snippet and
            deep links that open the chat — or the exact message — inside Telegram.
          </p>
          <div
            id="result-examples"
            className="mt-6 space-y-3 rounded-lg border border-border bg-card p-5 font-mono text-sm"
          >
            <p className="text-muted-foreground">🔍 photography — Channels · 10 results</p>
            <p>
              <span className="text-primary">1. 📢 Daily Photography</span>
              <br />
              <span className="text-muted-foreground">@dailyphotography · 👥 128.4K</span>
              <br />
              <span className="text-muted-foreground">Open chat · Open message</span>
            </p>
            <p>
              <span className="text-primary">2. 👥 Street Photo Talk</span>
              <br />
              <span className="text-muted-foreground">@streetphototalk · 👥 12.9K</span>
              <br />
              <span className="text-muted-foreground">Open chat</span>
            </p>
          </div>
        </section>

        <section className="border-t border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Three steps</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Open @CombSearchBot", "Tap start in Telegram — no sign-up screen."],
              ["Send a keyword", "Anything from “rust jobs” to a file name."],
              ["Pick a category", "Channels, groups, files, videos, audios or links."],
            ].map(([title, desc], i) => (
              <li key={title} className="rounded-lg border border-border bg-card p-5">
                <span className="text-sm font-medium text-primary">Step {i + 1}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="faq" className="border-t border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            Telegram channel finder — frequently asked questions
          </h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-border bg-card p-5 open:bg-card"
              >
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                {item.link ? (
                  <Link
                    to={item.link.to}
                    className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
                  >
                    {item.link.label} →
                  </Link>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Guides</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["/blog/telegram-search", "How Telegram search really works"],
              ["/blog/telegram-channels", "Finding the best Telegram channels"],
              ["/blog/telegram-groups", "Finding active Telegram groups"],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
