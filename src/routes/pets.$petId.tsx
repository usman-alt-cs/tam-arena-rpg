import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { getPet, type Pet } from "@/lib/pets-store";
import {
  feed,
  play,
  evolve,
  getVitals,
  listEvents,
  type CareEvent,
  type CareKind,
  type PetVitals,
} from "@/lib/care-store";
import { useRequireWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/pets/$petId")({
  head: ({ params }) => ({
    meta: [
      { title: `Pet ${params.petId} — Tam Arena` },
      { name: "description", content: "Tam Arena pet profile, vitals, evolution progress and care history." },
    ],
  }),
  component: PetProfile,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => (
    <div className="p-10 font-mono-ui text-sm">Error loading pet: {error.message}</div>
  ),
});

function NotFound() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">No such Tam</h1>
        <p className="mt-3 text-muted-foreground">That pet was never minted on this device.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/hatch"><TactileButton>Hatch a pet</TactileButton></Link>
          <Link to="/"><TactileButton variant="ghost">Home</TactileButton></Link>
        </div>
      </main>
    </div>
  );
}

const STAGE_LABELS = ["Hatchling", "Adolescent", "Apex"];

function PetProfile() {
  const { petId } = useParams({ from: "/pets/$petId" });
  const navigate = useNavigate();
  const requireWallet = useRequireWallet();
  const [pet, setPet] = useState<Pet | null | undefined>(undefined);
  const [vitals, setVitals] = useState<PetVitals | null>(null);
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [pulse, setPulse] = useState<{ label: string; tone: "success" | "primary" | "warning" } | null>(null);

  function refresh(id: string) {
    setVitals(getVitals(id));
    setEvents(listEvents(id));
  }

  useEffect(() => {
    const p = getPet(petId);
    setPet(p ?? null);
    if (p) refresh(p.id);
  }, [petId]);

  function withWallet(action: string, run: () => void) {
    requireWallet({
      action,
      redirect: `/pets/${petId}`,
      run,
    });
  }

  function pop(label: string, tone: "success" | "primary" | "warning") {
    setPulse({ label, tone });
    setTimeout(() => setPulse(null), 1200);
  }

  if (pet === undefined) {
    return (
      <div className="min-h-screen bg-background text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16 font-mono-ui text-sm text-muted-foreground">
          Loading pet…
        </main>
      </div>
    );
  }
  if (pet === null) return <NotFound />;
  if (!vitals) return null;

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/hatch" className="font-mono-ui text-[12px] text-muted-foreground hover:text-ink">
          ← back to hatchery
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Portrait */}
          <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
              <span className="font-mono-ui text-[11px] uppercase tracking-wider">tam #{pet.id.slice(-4)}</span>
              <span className="font-mono-ui text-[11px] text-success">● alive · stage {vitals.evoStage}/3</span>
            </div>
            <div className="relative grid place-items-center bg-[radial-gradient(ellipse_at_center,_var(--muted)_0%,_var(--background)_70%)] py-12">
              <img src={pet.sprite} alt={pet.name} className="h-64 w-64 object-contain animate-pet-idle" />
              {pulse && (
                <span
                  className={`absolute top-6 font-display text-2xl pointer-events-none ${pulse.tone === "success" ? "text-success" : pulse.tone === "warning" ? "text-warning" : "text-primary"}`}
                  style={{ animation: "pet-bounce 1s ease-out forwards" }}
                >
                  {pulse.label}
                </span>
              )}
            </div>
            <div className="border-t-2 border-ink px-5 py-4 flex flex-wrap items-center gap-2">
              <Chip>{pet.rarity}</Chip>
              <Chip>{pet.element}</Chip>
              <Chip>{pet.species}</Chip>
              <Chip tone="primary">Lv {vitals.level}</Chip>
              <Chip tone="arcade">{STAGE_LABELS[vitals.evoStage - 1]}</Chip>
            </div>
          </section>

          {/* Vitals + actions */}
          <section className="space-y-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{pet.name}</h1>
              <p className="mt-2 font-mono-ui text-[12px] text-muted-foreground break-all">
                hatched {new Date(pet.hatchedAt).toLocaleString()} · tx {pet.txHash}
              </p>
            </div>

            {/* Health & happiness — primary meters */}
            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
              <div className="font-mono-ui text-[11px] uppercase text-muted-foreground">vitals</div>
              <Meter label="❤ Health" value={vitals.health} tone="success" />
              <Meter label="✨ Happiness" value={vitals.happiness} tone="primary" />
              <Meter label="🍖 Hunger" value={vitals.hunger} tone="warning" />
            </div>

            {/* Stat panels */}
            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
              <div className="flex justify-between font-mono-ui text-[11px] uppercase text-muted-foreground">
                <span>combat stats</span>
                <span className="text-ink">XP {vitals.xp} / {vitals.level * 100}</span>
              </div>
              <StatBar label="HP" value={pet.stats.hp} max={220} tone="primary" />
              <StatBar label="Strength" value={pet.stats.str} max={28} tone="warning" />
              <StatBar label="Agility" value={pet.stats.agi} max={28} tone="arcade" />
              <StatBar label="Intellect" value={pet.stats.int} max={28} tone="success" />
            </div>

            {/* Evolution */}
            <div className="rounded-2xl border-2 border-ink bg-ink text-background shadow-[var(--shadow-card)] p-5">
              <div className="flex justify-between font-mono-ui text-[11px] uppercase opacity-70">
                <span>evolution chain</span>
                <span>{vitals.evoProgress.toFixed(0)}% to next form</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {STAGE_LABELS.map((s, i) => {
                  const idx = i + 1;
                  const reached = idx <= vitals.evoStage;
                  const current = idx === vitals.evoStage;
                  return (
                    <div key={s} className="flex-1">
                      <div className={`rounded-md border-2 px-3 py-2 text-center font-mono-ui text-[11px] ${reached ? "border-background bg-background text-ink" : "border-background/30 text-background/60"} ${current ? "ring-2 ring-secondary" : ""}`}>
                        {s}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 h-2 rounded-full bg-background/15 overflow-hidden">
                <div className="h-full bg-secondary transition-[width] duration-500" style={{ width: `${vitals.evoProgress}%` }} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5">
              <div className="font-mono-ui text-[11px] uppercase text-muted-foreground mb-3">care_loop</div>
              <div className="grid grid-cols-2 gap-3">
                <TactileButton
                  variant="secondary"
                  onClick={() => withWallet("feed", () => { feed(pet.id); refresh(pet.id); pop("+28 hunger", "warning"); })}
                >
                  🍖 Feed
                </TactileButton>
                <TactileButton
                  variant="ghost"
                  onClick={() => withWallet("play", () => { play(pet.id); refresh(pet.id); pop("+24 happy", "primary"); })}
                >
                  🎾 Play
                </TactileButton>
                <TactileButton
                  onClick={() => withWallet("battle", () => { navigate({ to: "/" }); setTimeout(() => window.scrollTo({ top: 0 }), 50); })}
                >
                  ⚔ Enter Arena
                </TactileButton>
                <TactileButton
                  variant="ink"
                  disabled={vitals.evoProgress < 100 || vitals.evoStage >= 3}
                  onClick={() => withWallet("evolve", () => { const r = evolve(pet.id); if (r) { refresh(pet.id); pop("EVOLVED!", "success"); } })}
                >
                  🧬 Evolve {vitals.evoStage >= 3 ? "(max)" : `(${vitals.evoProgress.toFixed(0)}%)`}
                </TactileButton>
              </div>
            </div>
          </section>
        </div>

        {/* Care history */}
        <section className="mt-10 rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
            <span className="font-mono-ui text-[11px] uppercase">care_history.log</span>
            <span className="font-mono-ui text-[11px] text-muted-foreground">{events.length} events</span>
          </div>
          {events.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono-ui text-[12px]">
              No history yet. Try feeding or playing.
            </div>
          ) : (
            <ol className="divide-y-2 divide-ink/5">
              {events.map((e) => (
                <li key={e.id} className="grid grid-cols-[24px_1fr_auto] items-start gap-4 px-5 py-3.5">
                  <span className="mt-1.5 inline-block h-3 w-3 rounded-full border-2 border-ink" style={{ background: kindColor(e.kind) }} />
                  <div>
                    <div className="font-mono-ui text-[11px] uppercase text-muted-foreground">{e.kind}</div>
                    <div className="text-sm">{e.detail}</div>
                    <div className="font-mono-ui text-[10px] text-muted-foreground mt-0.5 break-all">tx {e.txHash}</div>
                  </div>
                  <div className="font-mono-ui text-[11px] tabular-nums text-muted-foreground whitespace-nowrap">
                    {timeAgo(e.at)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: "success" | "primary" | "warning" }) {
  return (
    <div>
      <div className="flex justify-between font-mono-ui text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{Math.round(value)}/100</span>
      </div>
      <div className="mt-1.5 h-3 rounded-sm border-2 border-ink bg-card overflow-hidden">
        <div
          className={`h-full transition-[width] duration-500 ${tone === "success" ? "bg-success" : tone === "primary" ? "bg-primary" : "bg-warning"}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function kindColor(k: CareKind) {
  switch (k) {
    case "hatch": return "var(--secondary)";
    case "feed": return "var(--warning)";
    case "play": return "var(--primary)";
    case "battle": return "var(--accent)";
    case "evolve": return "var(--success)";
  }
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}
