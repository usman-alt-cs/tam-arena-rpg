import { Link } from "@tanstack/react-router";
import { TactileButton } from "./TactileButton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-md border-2 border-ink bg-primary text-primary-foreground shadow-[0_3px_0_var(--ink)]"
            aria-hidden
          >
            <span className="font-display text-lg leading-none">T</span>
          </span>
          <span className="font-display text-xl tracking-tight">Tam Arena</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            ["Hatch", "/"],
            ["Arena", "/"],
            ["Marketplace", "/"],
            ["Leaderboards", "/"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono-ui text-[12px] px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <TactileButton variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </TactileButton>
          <TactileButton size="sm">Connect Wallet</TactileButton>
        </div>
      </div>
    </header>
  );
}
