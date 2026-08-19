import { Link } from "@tanstack/react-router";

export const BOT_URL = "https://t.me/CombSearchBot";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="text-xl">🔍</span>
          <span>Comb Search Bot</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
            Guides
          </Link>
          <a
            href={BOT_URL}
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open bot
          </a>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Comb Search Bot — free Telegram search, no account or database required.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/" className="transition-colors hover:text-foreground">
            Telegram search
          </Link>
          <Link to="/blog" className="transition-colors hover:text-foreground">
            Guides
          </Link>
          <a href={BOT_URL} className="transition-colors hover:text-foreground">
            @CombSearchBot
          </a>
        </div>
      </div>
    </footer>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
      {children}
    </div>
  );
}
