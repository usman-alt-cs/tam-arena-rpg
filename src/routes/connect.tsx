import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { connectWallet, DEMO_ACCOUNTS, shortAddr } from "@/lib/wallet-store";

interface Search {
  redirect?: string;
  action?: string;
}

export const Route = createFileRoute("/connect")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    action: typeof s.action === "string" ? s.action : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connect Wallet — Tam Arena" },
      { name: "description", content: "Approve a wallet to hatch, feed, and battle Tams on Polygon." },
    ],
  }),
  component: ConnectPage,
});

const ACTION_COPY: Record<string, { verb: string; line: string }> = {
  hatch: { verb: "Hatch a Tam", line: "Signing mints a new pet to this wallet." },
  feed: { verb: "Feed your pet", line: "A care tx will be submitted on Polygon." },
  play: { verb: "Play with your pet", line: "Sub-cent gas. Settles in <500ms." },
  battle: { verb: "Enter the arena", line: "Each round records a verifiable match outcome." },
  evolve: { verb: "Evolve your Tam", line: "Locks the new form on-chain." },
  list: { verb: "List on marketplace", line: "Approval lets the contract custody the listed pet." },
  buy: { verb: "Buy this pet", line: "Funds + ownership swap atomically." },
};

function ConnectPage() {
  const { redirect, action } = Route.useSearch();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "approving" | "approved">("idle");

  const copy = (action && ACTION_COPY[action]) ?? { verb: "Connect your wallet", line: "Tam Arena uses your wallet to sign care, battle, and trade actions." };

  function approve() {
    if (!picked) return;
    setPhase("approving");
    setTimeout(() => {
      const acc = DEMO_ACCOUNTS.find((a) => a.address === picked)!;
      connectWallet(acc.address, acc.label);
      setPhase("approved");
      setTimeout(() => {
        if (redirect && redirect.startsWith("/")) {
          // soft redirect using window.location to support arbitrary paths incl. params
          window.location.href = redirect;
        } else {
          navigate({ to: "/" });
        }
      }, 700);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[820px] px-5 py-12 sm:px-8 sm:py-20">
        <Link to="/" className="font-mono-ui text-[12px] text-muted-foreground hover:text-ink">
          ← cancel
        </Link>

        <header className="mt-6">
          {action && <Chip tone="primary" className="mb-3">action · {action}</Chip>}
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{copy.verb}</h1>
          <p className="mt-3 text-muted-foreground">{copy.line}</p>
        </header>

        <section className="mt-8 rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider">wallet_provider · demo</span>
            <span className="font-mono-ui text-[11px] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              polygon · chain 137
            </span>
          </div>
          <ul className="divide-y-2 divide-ink/10">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.address}>
                <button
                  type="button"
                  onClick={() => setPicked(a.address)}
                  disabled={phase !== "idle"}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/60 transition-colors ${picked === a.address ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`grid h-10 w-10 place-items-center rounded-md border-2 border-ink font-display text-sm ${picked === a.address ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {a.label.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="font-display text-base">{a.label}</div>
                      <div className="font-mono-ui text-[11px] text-muted-foreground tabular-nums">
                        {shortAddr(a.address)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-ui text-[12px] tabular-nums">{a.balance}</div>
                    <div className="font-mono-ui text-[10px] text-muted-foreground">balance</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t-2 border-ink px-5 py-5 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono-ui text-[11px] text-muted-foreground">
              {phase === "idle" && "Pick an account, then approve to continue."}
              {phase === "approving" && "Awaiting signature on Polygon…"}
              {phase === "approved" && (
                <span className="text-success">✓ Wallet approved — routing back…</span>
              )}
            </div>
            <TactileButton size="md" onClick={approve} disabled={!picked || phase !== "idle"}>
              {phase === "approving" ? "Signing…" : phase === "approved" ? "Connected" : "Approve & continue"}
            </TactileButton>
          </div>
        </section>

        <p className="mt-6 font-mono-ui text-[11px] text-muted-foreground text-center">
          This is a demo wallet. No real keys are stored or transmitted.
        </p>
      </main>
    </div>
  );
}
