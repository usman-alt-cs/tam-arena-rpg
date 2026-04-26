import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { BattleWidget } from "@/components/tam/BattleWidget";
import petPurple from "@/assets/pet-purple.png";
import petPink from "@/assets/pet-pink.png";
import petEgg from "@/assets/pet-egg.png";
import petLegendary from "@/assets/pet-legendary.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tam Arena — Hatch. Raise. Dominate." },
      {
        name: "description",
        content:
          "On-chain virtual pet arena. Hatch NFT pets, raise them with Tamagotchi-style care, and dominate ranked rock-paper-scissors battles on Polygon L2.",
      },
      { property: "og:title", content: "Tam Arena — Hatch. Raise. Dominate." },
      {
        property: "og:description",
        content:
          "Real-time RPS combat with stat-modified pets. Zero-gas L2 mechanics. Stop staking static JPEGs.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <Hero />
      <CareLoop />
      <ArenaStrip />
      <Economics />
      <Marketplace />
      <CTA />
      <Footer />
    </div>
  );
}

/* ============================ HERO ============================ */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink dot-bg">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-2 lg:py-24">
        {/* Left */}
        <div className="flex flex-col justify-center">
          <Chip tone="primary" className="self-start">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            On-chain virtual pet arena
          </Chip>
          <h1 className="mt-5 font-display font-semibold leading-[0.92] tracking-[-0.04em] text-[clamp(3rem,8vw,7.5rem)]">
            Hatch.
            <br />
            Raise.
            <br />
            <span className="text-primary">Dominate.</span>
          </h1>
          <p className="mt-6 max-w-[55ch] text-lg text-muted-foreground leading-relaxed">
            Stop staking static JPEGs. Tam Arena is a Tamagotchi-style NFT pet game with real-time
            rock-paper-scissors combat and zero-gas L2 mechanics. Every feed, fight, and evolution is
            on-chain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/hatch"><TactileButton size="lg">⚡ Hatch your first pet</TactileButton></Link>
            <Link to="/marketplace"><TactileButton variant="ghost" size="lg">Browse marketplace ↗</TactileButton></Link>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {[
              ["12,847", "Pets hatched"],
              ["4,471", "Battles today"],
              ["$0.0001", "Gas / action"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-lg border-2 border-ink bg-card p-3">
                <div className="font-display text-xl tabular-nums">{n}</div>
                <div className="font-mono-ui text-[10px] text-muted-foreground mt-0.5">{l}</div>
              </div>
            ))}
          </dl>
        </div>

        {/* Right — battle widget */}
        <div className="relative">
          <div className="absolute -top-3 -right-3 z-10 hidden sm:block">
            <Chip tone="warning">⚔ Try it · No wallet needed</Chip>
          </div>
          <BattleWidget />
        </div>
      </div>
    </section>
  );
}

/* ========================== CARE LOOP ========================== */
function CareLoop() {
  return (
    <section className="border-b-2 border-ink py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <Chip tone="arcade">02 · The bond</Chip>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl font-semibold leading-[0.95] tracking-[-0.03em]">
              Pets that <span className="text-secondary">need you</span>.
              Not spreadsheet rows.
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg text-muted-foreground leading-relaxed">
              Feed, play, rest. Skip a day and your pet sulks — stats drop, evolution stalls. Care
              quality is the only path to a legendary form.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["🍎 Feed", "🎮 Play", "💤 Rest", "🧬 Evolve"].map((c) => (
                <Chip key={c} tone="ink">{c}</Chip>
              ))}
            </div>
          </div>

          {/* Care card */}
          <div className="relative rounded-2xl border-2 border-ink bg-card p-6 shadow-[6px_6px_0_var(--ink)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl">Mochi</div>
                <div className="font-mono-ui text-[11px] text-muted-foreground">
                  Lv 14 · Cloud-fox · #00471
                </div>
              </div>
              <Chip tone="success">● Healthy</Chip>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="grid place-items-center rounded-xl border-2 border-ink bg-background p-4 grid-bg h-44">
                <img
                  src={petPink}
                  alt="Mochi"
                  width={150}
                  height={150}
                  loading="lazy"
                  className="h-32 w-auto pixelated pixel-shadow animate-[pet-idle_2.4s_ease-in-out_infinite]"
                />
              </div>
              <div className="space-y-3">
                <StatBar label="Happiness" value={86} tone="primary" />
                <StatBar label="Hunger" value={62} tone="warning" />
                <StatBar label="Energy" value={74} tone="success" />
                <StatBar label="XP → Lv 15" value={420} max={500} tone="arcade" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <TactileButton variant="secondary" size="sm">🍎 Feed</TactileButton>
              <TactileButton variant="ghost" size="sm">🎮 Play</TactileButton>
              <TactileButton variant="ink" size="sm">⚔ Battle</TactileButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ ARENA ============================ */
function ArenaStrip() {
  return (
    <section className="relative border-b-2 border-ink bg-ink text-background py-20 sm:py-28 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chip tone="primary">03 · The arena</Chip>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl font-semibold leading-[0.95] tracking-[-0.03em] text-background">
              Rock. Paper. <span className="text-secondary">Scissors.</span>
              <br />Now with consequences.
            </h2>
          </div>
          <p className="max-w-[42ch] text-base text-background/70 leading-relaxed">
            Every move is modified by Strength, Agility, and Intelligence. A Lv 12 brawler can sweep a
            careless Lv 30 — but only if the matchup lines up.
          </p>
        </div>

        {/* Matchup grid */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              name: "Cyber-Rex",
              tag: "Lv 36 · Legendary",
              src: petLegendary,
              wr: 74,
              tone: "primary" as const,
              stats: { str: 92, agi: 48, int: 67 },
            },
            {
              name: "Voidling",
              tag: "Lv 22 · Rare",
              src: petPurple,
              wr: 58,
              tone: "arcade" as const,
              stats: { str: 54, agi: 81, int: 73 },
            },
            {
              name: "Mochi",
              tag: "Lv 14 · Common",
              src: petPink,
              wr: 49,
              tone: "warning" as const,
              stats: { str: 36, agi: 88, int: 52 },
            },
          ].map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border-2 border-background/30 bg-background/[0.04] p-5 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-2xl text-background">{p.name}</div>
                  <div className="font-mono-ui text-[11px] text-background/60 mt-0.5">{p.tag}</div>
                </div>
                <Chip tone={p.tone}>WR {p.wr}%</Chip>
              </div>
              <div className="mt-4 grid place-items-center h-40 rounded-xl border-2 border-background/20 bg-background/5">
                <img
                  src={p.src}
                  alt={p.name}
                  width={140}
                  height={140}
                  loading="lazy"
                  className="h-32 w-auto pixelated animate-[pet-idle_2.4s_ease-in-out_infinite]"
                  style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,0.6))" }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 font-mono-ui text-[10px] text-background/70">
                {(["str", "agi", "int"] as const).map((k) => (
                  <div key={k} className="rounded-md border border-background/20 p-2">
                    <div className="opacity-60">{k.toUpperCase()}</div>
                    <div className="font-display text-lg text-background tabular-nums">
                      {p.stats[k]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RPS rule strip */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["✊ Rock", "+ STR", "Crushes Scissors"],
            ["✋ Paper", "+ INT", "Smothers Rock"],
            ["✌ Scissors", "+ AGI", "Slices Paper"],
          ].map(([title, mod, sub]) => (
            <div
              key={title as string}
              className="flex items-center justify-between rounded-xl border-2 border-background/30 px-4 py-3"
            >
              <div className="font-display text-xl text-background">{title}</div>
              <div className="text-right">
                <div className="font-mono-ui text-[11px] text-secondary">{mod}</div>
                <div className="font-mono-ui text-[10px] text-background/60">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================== ECONOMICS ========================== */
function Economics() {
  return (
    <section className="border-b-2 border-ink py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Chip tone="success">04 · The proof</Chip>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl font-semibold leading-[0.95] tracking-[-0.03em]">
              No $5 gas to feed a pet.
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg text-muted-foreground leading-relaxed">
              Built on Polygon with Chainlink VRF for verifiable random hatches. Every action settles
              in under 500ms for less than the price of a USDC dust speck.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip tone="arcade">Polygon L2</Chip>
              <Chip tone="primary">Chainlink VRF</Chip>
              <Chip tone="ink">ERC-721</Chip>
              <Chip tone="success">Audited</Chip>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-ink bg-ink p-6 text-background shadow-[6px_6px_0_var(--ink)] font-mono">
            <div className="flex items-center justify-between text-[11px] text-background/60 font-mono-ui">
              <span>./tam-arena/tx-monitor</span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              {[
                ["FEED", "Mochi", "$0.00009", "412ms"],
                ["BATTLE", "Cyber-Rex vs Voidling", "$0.00018", "488ms"],
                ["HATCH", "Egg #00472", "$0.00021", "631ms"],
                ["EVOLVE", "Mochi → Lv 15", "$0.00012", "397ms"],
              ].map(([type, sub, cost, lat], i) => (
                <div
                  key={i}
                  className="grid grid-cols-[80px_1fr_auto_auto] items-center gap-3 rounded-md border border-background/15 px-3 py-2.5"
                >
                  <span className="font-mono-ui text-[11px] text-secondary">{type}</span>
                  <span className="text-background/80 truncate">{sub}</span>
                  <span className="font-mono-ui text-[11px] text-success tabular-nums">{cost}</span>
                  <span className="font-mono-ui text-[11px] text-background/50 tabular-nums">{lat}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-background/15 pt-4 font-mono-ui text-[10px] text-background/60">
              <div>
                <div className="text-background/40">Avg gas</div>
                <div className="text-success text-base font-display tabular-nums mt-1">$0.00015</div>
              </div>
              <div>
                <div className="text-background/40">Avg latency</div>
                <div className="text-background text-base font-display tabular-nums mt-1">482ms</div>
              </div>
              <div>
                <div className="text-background/40">Uptime · 30d</div>
                <div className="text-background text-base font-display tabular-nums mt-1">99.97%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================= MARKETPLACE ========================= */
function Marketplace() {
  const items = [
    { name: "Glacier Whelp", lvl: 41, price: "0.42", rarity: "Legendary", src: petLegendary, tone: "primary" as const },
    { name: "Sun Mochi", lvl: 28, price: "0.18", rarity: "Epic", src: petPink, tone: "warning" as const },
    { name: "Voidling Prime", lvl: 33, price: "0.27", rarity: "Rare", src: petPurple, tone: "arcade" as const },
    { name: "Hatchling #481", lvl: 1, price: "0.04", rarity: "Common", src: petEgg, tone: "ink" as const },
  ];
  return (
    <section className="border-b-2 border-ink py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Chip tone="primary">05 · The marketplace</Chip>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl font-semibold leading-[0.95] tracking-[-0.03em]">
              Champions on the floor.
            </h2>
          </div>
          <Link to="/marketplace" className="font-mono-ui text-[12px] underline underline-offset-4 hover:text-primary">
            Browse all listings →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <div
              key={p.name}
              className="group rounded-2xl border-2 border-ink bg-card p-4 shadow-[4px_4px_0_var(--ink)] hover:shadow-[2px_2px_0_var(--ink)] hover:translate-y-[2px] transition-all"
            >
              <div className="grid place-items-center h-40 rounded-xl border-2 border-ink bg-background grid-bg">
                <img
                  src={p.src}
                  alt={p.name}
                  width={130}
                  height={130}
                  loading="lazy"
                  className="h-28 w-auto pixelated pixel-shadow animate-[pet-idle_2.4s_ease-in-out_infinite]"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg leading-tight">{p.name}</div>
                  <div className="font-mono-ui text-[10px] text-muted-foreground mt-0.5">
                    Lv {p.lvl} · {p.rarity}
                  </div>
                </div>
                <Chip tone={p.tone}>◈ {p.price}</Chip>
              </div>
              <TactileButton variant="ghost" size="sm" className="mt-4 w-full">
                Inspect
              </TactileButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== CTA ============================== */
function CTA() {
  return (
    <section className="border-b-2 border-ink py-20 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-primary p-10 sm:p-16 text-primary-foreground shadow-[8px_8px_0_var(--ink)]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(white 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <Chip tone="ink" className="!bg-ink !text-background">
                Genesis season · Live
              </Chip>
              <h2 className="mt-5 font-display text-5xl sm:text-7xl font-semibold leading-[0.92] tracking-[-0.03em]">
                Your egg is waiting.
              </h2>
              <p className="mt-5 max-w-[48ch] text-lg text-primary-foreground/85 leading-relaxed">
                First 10,000 hatches are gas-subsidized. Connect a wallet, mint an egg, and take a
                shot at the first season's leaderboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <TactileButton variant="ink" size="lg" className="!text-background">
                  ⚡ Hatch now · Free
                </TactileButton>
                <TactileButton variant="ghost" size="lg">
                  Read the docs ↗
                </TactileButton>
              </div>
            </div>

            <div className="relative grid place-items-center">
              <div className="absolute h-56 w-56 rounded-full bg-secondary border-2 border-ink" />
              <img
                src={petEgg}
                alt="Glowing egg"
                width={260}
                height={260}
                loading="lazy"
                className="relative h-64 w-auto pixelated pixel-shadow animate-[pet-idle_2.4s_ease-in-out_infinite]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ FOOTER ============================ */
function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-ink bg-primary text-primary-foreground">
            <span className="font-display text-base leading-none">T</span>
          </span>
          <span className="font-display text-lg">Tam Arena</span>
          <span className="font-mono-ui text-[11px] text-muted-foreground ml-2">v0.1 · Genesis</span>
        </div>
        <nav className="flex flex-wrap gap-5 font-mono-ui text-[11px]">
          {["Whitepaper", "Discord", "X / Twitter", "Contracts", "Privacy"].map((l) => (
            <a key={l} className="hover:text-primary transition-colors" href="#">
              {l}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
