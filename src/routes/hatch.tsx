import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { RARITY_ODDS, mintPet, savePet, type Pet } from "@/lib/pets-store";
import { useRequireWallet } from "@/hooks/use-wallet";
import petEgg from "@/assets/pet-egg.png";

export const Route = createFileRoute("/hatch")({
  head: () => ({
    meta: [
      { title: "Hatch — Tam Arena" },
      {
        name: "description",
        content:
          "Incubate an on-chain egg, view live rarity odds and gas estimates, then mint your Tam Arena pet on Polygon L2.",
      },
      { property: "og:title", content: "Hatch your Tam — Tam Arena" },
      {
        property: "og:description",
        content: "Live rarity odds, sub-cent gas, and a real RPS-ready pet at the end of the loop.",
      },
    ],
  }),
  component: HatchPage,
});

type Phase = "idle" | "incubating" | "minting" | "revealed";

const INCUBATE_MS = 4200;

function HatchPage() {
  const navigate = useNavigate();
  const requireWallet = useRequireWallet();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [pet, setPet] = useState<Pet | null>(null);

  // Mock live gas oracle (polls every 2s)
  const [gas, setGas] = useState(() => mockGas());
  useEffect(() => {
    const t = setInterval(() => setGas(mockGas()), 2200);
    return () => clearInterval(t);
  }, []);

  // Incubation timer
  useEffect(() => {
    if (phase !== "incubating") return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / INCUBATE_MS);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setPhase("minting");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Mint after incubation
  useEffect(() => {
    if (phase !== "minting") return;
    const t = setTimeout(() => {
      const p = mintPet();
      savePet(p);
      setPet(p);
      setPhase("revealed");
    }, 1100);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-10 max-w-2xl">
          <Chip className="mb-3">/hatch · L2 mint flow</Chip>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-balance">
            Crack an egg. Roll the chain.
          </h1>
          <p className="mt-3 text-muted-foreground text-pretty">
            One transaction mints one Tam. Stats, element, and rarity are decided by the block hash
            at confirmation — no rerolls, no take-backs.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Incubator phase={phase} progress={progress} pet={pet} onStart={() => requireWallet({ action: "hatch", redirect: "/hatch", run: () => setPhase("incubating") })} onView={() => pet && navigate({ to: "/pets/$petId", params: { petId: pet.id } })} />

          <aside className="space-y-6">
            <RarityOdds />
            <GasEstimator gas={gas} disabled={phase !== "idle"} />
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ---------- Incubator panel ---------- */

function Incubator({
  phase,
  progress,
  pet,
  onStart,
  onView,
}: {
  phase: Phase;
  progress: number;
  pet: Pet | null;
  onStart: () => void;
  onView: () => void;
}) {
  const status =
    phase === "idle"
      ? "Awaiting signature"
      : phase === "incubating"
        ? `Incubating · block ${(progress * 12).toFixed(0)}/12`
        : phase === "minting"
          ? "Confirming on Polygon…"
          : "Hatched";

  return (
    <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">incubator.v1</span>
        <span className="font-mono-ui text-[11px] flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${phase === "idle" ? "bg-muted-foreground" : "bg-success animate-pulse"}`} />
          {status}
        </span>
      </div>

      <div className="relative grid place-items-center px-6 py-12 sm:py-16 bg-[radial-gradient(ellipse_at_center,_var(--muted)_0%,_var(--background)_70%)]">
        {/* scanline */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(0deg,var(--ink)_0_1px,transparent_1px_3px)]" />

        {phase !== "revealed" && (
          <div className="relative">
            {/* glow ring */}
            <div
              className="absolute inset-0 -m-8 rounded-full border-2 border-dashed border-ink/30"
              style={{
                transform: `rotate(${progress * 540}deg)`,
                transition: "transform 100ms linear",
              }}
            />
            <img
              src={petEgg}
              alt="Incubating egg"
              className={`relative h-56 w-56 object-contain ${phase === "incubating" || phase === "minting" ? "animate-pet-bounce" : "animate-pet-idle"}`}
              style={{
                filter: phase === "minting" ? "hue-rotate(40deg) brightness(1.1)" : undefined,
              }}
            />
          </div>
        )}

        {phase === "revealed" && pet && (
          <div className="relative text-center">
            <img src={pet.sprite} alt={pet.name} className="mx-auto h-56 w-56 object-contain animate-pet-idle" />
            <div className="mt-4 flex items-center justify-center gap-2">
              <Chip>{pet.rarity}</Chip>
              <Chip>{pet.element}</Chip>
            </div>
            <p className="mt-2 font-display text-2xl">{pet.name}</p>
          </div>
        )}
      </div>

      {/* progress + actions */}
      <div className="border-t-2 border-ink px-5 py-5 space-y-4">
        <StatBar label="Incubation" value={Math.round(progress * 100)} max={100} tone="primary" />

        {phase === "idle" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono-ui text-[12px] text-muted-foreground">
              Sign once to lock entropy from the next block.
            </p>
            <TactileButton size="lg" onClick={onStart}>
              Hatch egg →
            </TactileButton>
          </div>
        )}

        {(phase === "incubating" || phase === "minting") && (
          <p className="font-mono-ui text-[12px] text-muted-foreground">
            Do not close this tab. Entropy is being committed to the chain.
          </p>
        )}

        {phase === "revealed" && pet && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono-ui text-[12px]">
              <Row k="STR" v={pet.stats.str} />
              <Row k="AGI" v={pet.stats.agi} />
              <Row k="INT" v={pet.stats.int} />
              <Row k="HP" v={pet.stats.hp} />
              <Row k="tx" v={pet.txHash} mono />
            </div>
            <div className="flex flex-wrap gap-2">
              <TactileButton size="md" onClick={onView}>
                View pet profile →
              </TactileButton>
              <Link to="/hatch">
                <TactileButton size="md" variant="ghost">
                  Hatch another
                </TactileButton>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ k, v, mono }: { k: string; v: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-ink/15 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className={mono ? "tabular-nums" : "tabular-nums font-semibold"}>{v}</span>
    </div>
  );
}

/* ---------- Rarity odds ---------- */

function RarityOdds() {
  return (
    <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="border-b-2 border-ink bg-muted px-5 py-2.5 flex items-center justify-between">
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">drop_table.csv</span>
        <span className="font-mono-ui text-[11px] text-muted-foreground">verifiable on-chain</span>
      </div>
      <ul className="divide-y-2 divide-ink/10">
        {RARITY_ODDS.map((o) => (
          <li key={o.rarity} className="flex items-center gap-4 px-5 py-3">
            <span className={`inline-flex h-7 min-w-16 items-center justify-center rounded-md border-2 border-ink px-2 font-mono-ui text-[11px] uppercase ${o.tone}`}>
              {o.rarity}
            </span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden border border-ink/20">
                <div className="h-full bg-ink" style={{ width: `${o.pct}%` }} />
              </div>
            </div>
            <span className="font-mono-ui text-[12px] tabular-nums w-12 text-right">
              {o.pct.toFixed(o.pct < 1 ? 2 : 0)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Gas estimator ---------- */

interface Gas {
  gwei: number;
  matic: number;
  usd: number;
  eta: number;
  block: number;
}

function mockGas(): Gas {
  const gwei = +(28 + Math.random() * 14).toFixed(1);
  const matic = +(0.00018 + Math.random() * 0.00009).toFixed(5);
  return {
    gwei,
    matic,
    usd: +(matic * 0.74).toFixed(4),
    eta: 2 + Math.floor(Math.random() * 3),
    block: 58_400_000 + Math.floor(Math.random() * 9999),
  };
}

function GasEstimator({ gas, disabled }: { gas: Gas; disabled: boolean }) {
  const tone = gas.gwei < 34 ? "text-success" : gas.gwei < 40 ? "text-warning" : "text-destructive";
  return (
    <section className="rounded-2xl border-2 border-ink bg-ink text-background shadow-[var(--shadow-card)] overflow-hidden">
      <div className="border-b-2 border-background/20 px-5 py-2.5 flex items-center justify-between">
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">gas_oracle · polygon</span>
        <span className="font-mono-ui text-[11px] flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          live
        </span>
      </div>
      <div className="px-5 py-5 space-y-4 font-mono-ui text-[12px]">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-background/60 uppercase text-[10px] tracking-wider">Network fee</div>
            <div className="font-display text-3xl tabular-nums">${gas.usd.toFixed(4)}</div>
          </div>
          <div className={`text-right ${tone} ${disabled ? "opacity-50" : ""}`}>
            <div className="tabular-nums text-2xl">{gas.gwei}</div>
            <div className="text-background/60 text-[10px] uppercase">gwei</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-background/15 pt-3">
          <Cell k="cost" v={`${gas.matic} MATIC`} />
          <Cell k="eta" v={`~${gas.eta}s`} />
          <Cell k="block" v={`#${gas.block.toLocaleString()}`} />
        </div>
      </div>
    </section>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-background/50 uppercase text-[10px] tracking-wider">{k}</div>
      <div className="tabular-nums">{v}</div>
    </div>
  );
}
