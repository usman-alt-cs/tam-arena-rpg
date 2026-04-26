import { Link } from "@tanstack/react-router";
import { TactileButton } from "./TactileButton";
import { useWallet } from "@/hooks/use-wallet";
import { disconnectWallet, shortAddr } from "@/lib/wallet-store";

export function SiteHeader() {
  const wallet = useWallet();

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
          <Link to="/hatch" className="font-mono-ui text-[12px] px-3 py-2 rounded-md hover:bg-muted transition-colors" activeProps={{ className: "bg-muted" }}>
            Hatch
          </Link>
          <Link to="/marketplace" className="font-mono-ui text-[12px] px-3 py-2 rounded-md hover:bg-muted transition-colors" activeProps={{ className: "bg-muted" }}>
            Marketplace
          </Link>
          {["Arena", "Leaderboards"].map((label) => (
            <a
              key={label}
              href="/"
              className="font-mono-ui text-[12px] px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {wallet ? (
            <>
              <span className="hidden sm:inline-flex font-mono-ui text-[11px] px-2 py-1 rounded-md border-2 border-ink bg-success/15">
                ● {shortAddr(wallet.address)}
              </span>
              <TactileButton size="sm" variant="ghost" onClick={() => disconnectWallet()}>
                Disconnect
              </TactileButton>
            </>
          ) : (
            <Link to="/connect">
              <TactileButton size="sm">Connect Wallet</TactileButton>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
