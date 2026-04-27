import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { mintFromEgg, savePet, type Pet } from "@/lib/pets-store";
import { useRequireWallet } from "@/hooks/use-wallet";
import { EGGS, EGG_ODDS, RARITY_TONE, ELEMENT_GLYPH, type EggDef, type EggTier } from "@/lib/species-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hatch")({
  head: () => ({
    meta: [
      { title: "Hatch — Tam Arena" },
      { name: "description", content: "Five-tier gacha hatch — Common, Rare, Epic, Legendary, Mythic. Live odds, gas estimates, cinematic reveal." },
      { property: "og:title", content: "Hatch your Tam — Tam Arena" },
      { property: "og:description", content: "Five-tier egg gacha with cinematic reveal and verifiable on-chain odds." },
    ],
  }),
  component: HatchPage,
});

type Phase = "idle" | "incubating" | "minting" | "revealed";
const INCUBATE_MS = 4200;

function HatchPage() {
  const navigate = useNavigate();
  const requireWallet = useRequireWallet();
  const [tier, setTier] = useState<EggTier>("common");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [pet, setPet] = useState<Pet | null>(null);

  const egg = useMemo(() => EGGS.find((e) => e.tier === tier)!, [tier]);

  const [gas, setGas] = useState(() => mockGas());
  useEffect(() => {
    const t = setInterval(() => setGas(mockGas()), 2200);
    return () => clearInterval(t);
  }, []);

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

  useEffect(() => {
    if (phase !== "minting") return;
    const t = setTimeout(() => {
      const p = mintFromEgg(tier);
      savePet(p);
      setPet(p);
      setPhase("revealed");
    }, 1100);
    return () => clearTimeout(t);
  }, [phase, tier]);

  function start() {
    requireWallet({
      action: "hatch", redirect: "/hatch",
      run: () => { setPhase("incubating"); setProgress(0); setPet(null); },
    });
  }
  function reset() { setPhase("idle"); setProgress(0); setPet(null); }

  const isRare = pet && (pet.rarity === "Legendary" || pet.rarity === "Mythic" || pet.rarity === "Epic");

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8 max-w-2xl">
          <Chip className="mb-3">/hatch · gacha L2 mint flow</Chip>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-balance">
            Pick an egg. Roll the chain.
          </h1>
          <p className="mt-3 text-muted-foreground text-pretty">
            Five tiers, escalating odds. Each egg's drop table is verifiable on-chain — entropy committed at confirmation.
          </p>
        </header>

        {/* Egg carousel */}
        {phase === "idle" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {EGGS.map((e) => (
              <button
                key={e.tier}
                onClick={() => setTier(e.tier)}
                className={cn(
                  "rounded-2xl border-2 border-ink p-4 text-left transition-all hover:-translate-y-0.5",
                  tier === e.tier ? "shadow-[var(--shadow-card)] bg-card" : "bg-card/60 shadow-[3px_3px_0_var(--ink)]",
                )}
              >
                <div className={cn("mx-auto mb-3 grid h-24 w-20 place-items-center rounded-[40%/45%] border-2 border-ink", e.bg, tier === e.tier && e.glow)}>
                  <div className={cn("h-3 w-3 rounded-full bg-background/70", "animate-pulse")} />
                </div>
                <div className="font-display text-sm">{e.label}</div>
                <div className="font-mono-ui text-[10px] text-muted-foreground mt-0.5">◈ {e.priceMatic} MATIC</div>
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Incubator
            egg={egg}
            phase={phase}
            progress={progress}
            pet={pet}
            isRareReveal={!!isRare}
            onStart={start}
            onView={() => pet && navigate({ to: "/pets/$petId", params: { petId: pet.id } })}
            onAnother={reset}
          />
          <aside className="space-y-6">
            <RarityOdds tier={tier} />
            <GasEstimator gas={gas} disabled={phase !== "idle"} egg={egg} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function Incubator({ egg, phase, progress, pet, isRareReveal, onStart, onView, onAnother }: {
  egg: EggDef; phase: Phase; progress: number; pet: Pet | null; isRareReveal: boolean;
  onStart: () => void; onView: () => void; onAnother: () => void;
}) {
  const status =
    phase === "idle" ? "Awaiting signature"
    : phase === "incubating" ? `Incubating · block ${(progress * 12).toFixed(0)}/12`
    : phase === "minting" ? "Confirming on Polygon…" : "Hatched";

  // Crack progression: 3 cracks appearing across incubation
  const cracks = Math.floor(progress * 3);

  return (
    <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">{egg.label} · incubator.v2</span>
        <span className="font-mono-ui text-[11px] flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${phase === "idle" ? "bg-muted-foreground" : "bg-success animate-pulse"}`} />
          {status}
        </span>
      </div>

      <div className="relative grid place-items-center px-6 py-12 sm:py-16 bg-[radial-gradient(ellipse_at_center,_var(--muted)_0%,_var(--background)_70%)] min-h-[360px]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(0deg,var(--ink)_0_1px,transparent_1px_3px)]" />

        {/* Confetti for rare reveal */}
        {phase === "revealed" && isRareReveal && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className="absolute h-2 w-2 rounded-sm" style={{
                left: `${Math.random() * 100}%`, top: "-10%",
                background: ["var(--primary)", "var(--secondary)", "var(--warning)", "var(--success)"][i % 4],
                animation: `pet-bounce ${1 + Math.random()}s ${Math.random() * 0.5}s ease-out forwards`,
                transform: `translateY(${Math.random() * 100}vh) rotate(${Math.random() * 360}deg)`,
              }} />
            ))}
          </div>
        )}

        {phase !== "revealed" && (
          <div className="relative">
            {/* Light burst on minting */}
            {phase === "minting" && (
              <div className="absolute inset-0 -m-12 rounded-full" style={{ background: "radial-gradient(circle, var(--secondary), transparent 70%)", animation: "pet-bounce 1s ease-out infinite" }} />
            )}
            {/* Egg shape */}
            <div
              className={cn(
                "relative grid h-56 w-44 place-items-center rounded-[42%/48%] border-2 border-ink",
                egg.bg, egg.glow,
                phase === "incubating" || phase === "minting" ? "animate-pet-bounce" : "animate-pet-idle",
              )}
              style={{
                transform: phase === "incubating" ? `rotate(${Math.sin(progress * 12) * 8}deg)` : undefined,
              }}
            >
              {/* Cracks */}
              {cracks >= 1 && <span className="absolute top-12 left-8 h-12 w-0.5 bg-ink rotate-12" />}
              {cracks >= 2 && <span className="absolute top-20 right-10 h-10 w-0.5 bg-ink -rotate-12" />}
              {cracks >= 3 && <span className="absolute top-16 left-1/2 h-14 w-0.5 bg-ink rotate-3" />}
              <span className="font-display text-2xl text-background/80">●</span>
            </div>
          </div>
        )}

        {phase === "revealed" && pet && (
          <div className="relative text-center">
            <img src={pet.sprite} alt={pet.name} className="mx-auto h-56 w-56 object-contain animate-pet-idle" />
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-md border-2 border-ink font-mono-ui text-[10px] uppercase ${RARITY_TONE[pet.rarity]}`}>{pet.rarity}</span>
              <Chip>{ELEMENT_GLYPH[pet.element as keyof typeof ELEMENT_GLYPH] ?? "•"} {pet.element}</Chip>
              <Chip>{pet.species}</Chip>
            </div>
            <p className="mt-2 font-display text-2xl">{pet.name}</p>
          </div>
        )}
      </div>

      <div className="border-t-2 border-ink px-5 py-5 space-y-4">
        <StatBar label="Incubation" value={Math.round(progress * 100)} max={100} tone="primary" />

        {phase === "idle" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono-ui text-[12px] text-muted-foreground">{egg.description}</p>
            <TactileButton size="lg" onClick={onStart}>Hatch {egg.label} →</TactileButton>
          </div>
        )}

        {(phase === "incubating" || phase === "minting") && (
          <p className="font-mono-ui text-[12px] text-muted-foreground">Do not close this tab. Entropy is being committed to the chain.</p>
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
              <TactileButton size="md" onClick={onView}>View pet profile →</TactileButton>
              <TactileButton size="md" variant="ghost" onClick={onAnother}>Hatch another</TactileButton>
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

function RarityOdds({ tier }: { tier: EggTier }) {
  const odds = EGG_ODDS[tier];
  return (
    <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="border-b-2 border-ink bg-muted px-5 py-2.5 flex items-center justify-between">
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">drop_table · {tier}</span>
        <span className="font-mono-ui text-[11px] text-muted-foreground">verifiable on-chain</span>
      </div>
      <ul className="divide-y-2 divide-ink/10">
        {odds.map((o) => (
          <li key={o.rarity} className="flex items-center gap-4 px-5 py-3">
            <span className={`inline-flex h-7 min-w-20 items-center justify-center rounded-md border-2 border-ink px-2 font-mono-ui text-[11px] uppercase ${RARITY_TONE[o.rarity]}`}>{o.rarity}</span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden border border-ink/20">
                <div className="h-full bg-ink" style={{ width: `${o.pct}%` }} />
              </div>
            </div>
            <span className="font-mono-ui text-[12px] tabular-nums w-12 text-right">{o.pct.toFixed(o.pct < 1 ? 2 : 0)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface Gas { gwei: number; matic: number; usd: number; eta: number; block: number; }
function mockGas(): Gas {
  const gwei = +(28 + Math.random() * 14).toFixed(1);
  const matic = +(0.00018 + Math.random() * 0.00009).toFixed(5);
  return { gwei, matic, usd: +(matic * 0.74).toFixed(4), eta: 2 + Math.floor(Math.random() * 3), block: 58_400_000 + Math.floor(Math.random() * 9999) };
}

function GasEstimator({ gas, disabled, egg }: { gas: Gas; disabled: boolean; egg: EggDef }) {
  const tone = gas.gwei < 34 ? "text-success" : gas.gwei < 40 ? "text-warning" : "text-destructive";
  return (
    <section className="rounded-2xl border-2 border-ink bg-ink text-background shadow-[var(--shadow-card)] overflow-hidden">
      <div className="border-b-2 border-background/20 px-5 py-2.5 flex items-center justify-between">
        <span className="font-mono-ui text-[11px] uppercase tracking-wider">gas_oracle · polygon</span>
        <span className="font-mono-ui text-[11px] flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />live
        </span>
      </div>
      <div className="px-5 py-5 space-y-4 font-mono-ui text-[12px]">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-background/60 uppercase text-[10px] tracking-wider">Network fee + mint</div>
            <div className="font-display text-3xl tabular-nums">${(gas.usd + egg.priceMatic * 0.74).toFixed(4)}</div>
          </div>
          <div className={`text-right ${tone} ${disabled ? "opacity-50" : ""}`}>
            <div className="tabular-nums text-2xl">{gas.gwei}</div>
            <div className="text-background/60 text-[10px] uppercase">gwei</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-background/15 pt-3">
          <Cell k="egg" v={`${egg.priceMatic} MATIC`} />
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
