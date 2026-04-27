import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { getPet, speciesOf, type Pet } from "@/lib/pets-store";
import {
  feed, play, train, evolve, getVitals, listEvents, winsFor, canEvolve,
  STAGE_LABELS, stageRequirement,
  type CareEvent, type CareKind, type PetVitals,
} from "@/lib/care-store";
import { useRequireWallet } from "@/hooks/use-wallet";
import { ELEMENT_GLYPH, ELEMENT_TONE, RARITY_TONE, ROSTER, type Skill } from "@/lib/species-catalog";

export const Route = createFileRoute("/pets/$petId")({
  head: ({ params }) => ({
    meta: [
      { title: `Pet ${params.petId} — Tam Arena` },
      { name: "description", content: "Tam Arena pet profile, vitals, evolution tree, signature skills and care history." },
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

function PetProfile() {
  const { petId } = useParams({ from: "/pets/$petId" });
  const navigate = useNavigate();
  const requireWallet = useRequireWallet();
  const [pet, setPet] = useState<Pet | null | undefined>(undefined);
  const [vitals, setVitals] = useState<PetVitals | null>(null);
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [wins, setWins] = useState(0);
  const [pulse, setPulse] = useState<{ label: string; tone: "success" | "primary" | "warning" } | null>(null);

  function refresh(id: string) {
    setVitals(getVitals(id));
    setEvents(listEvents(id));
    setWins(winsFor(id));
  }

  useEffect(() => {
    const p = getPet(petId);
    setPet(p ?? null);
    if (p) refresh(p.id);
  }, [petId]);

  function withWallet(action: string, run: () => void) {
    requireWallet({ action, redirect: `/pets/${petId}`, run });
  }

  function pop(label: string, tone: "success" | "primary" | "warning") {
    setPulse({ label, tone });
    setTimeout(() => setPulse(null), 1200);
  }

  if (pet === undefined) {
    return (
      <div className="min-h-screen bg-background text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16 font-mono-ui text-sm text-muted-foreground">Loading pet…</main>
      </div>
    );
  }
  if (pet === null) return <NotFound />;
  if (!vitals) return null;

  const species = speciesOf(pet);
  const skillTree: Skill[] = species ? ROSTER.find((s) => s.id === species.id)!.signature ? buildSkillTree(species.signature) : [] : [];
  const evoOk = canEvolve(vitals, wins);
  const req = stageRequirement(vitals.evoStage);

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14">
        <Link to="/hatch" className="font-mono-ui text-[12px] text-muted-foreground hover:text-ink">← back to hatchery</Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Portrait */}
          <section className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-ink bg-muted px-5 py-2.5">
              <span className="font-mono-ui text-[11px] uppercase tracking-wider">tam #{pet.id.slice(-4)}</span>
              <span className="font-mono-ui text-[11px] text-success">● alive · stage {vitals.evoStage}/5</span>
            </div>
            <div className="relative grid place-items-center bg-[radial-gradient(ellipse_at_center,_var(--muted)_0%,_var(--background)_70%)] py-12">
              <img src={pet.sprite} alt={pet.name} className="h-64 w-64 object-contain animate-pet-idle" style={{ filter: stageFilter(vitals.evoStage) }} />
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
              <span className={`inline-flex items-center px-2 py-1 rounded-md border-2 border-ink font-mono-ui text-[10px] uppercase ${RARITY_TONE[pet.rarity]}`}>{pet.rarity}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-ink font-mono-ui text-[10px] uppercase ${ELEMENT_TONE[(pet.element as keyof typeof ELEMENT_TONE)] ?? "bg-muted text-ink"}`}>
                {ELEMENT_GLYPH[(pet.element as keyof typeof ELEMENT_GLYPH)] ?? "•"} {pet.element}
              </span>
              <Chip>{pet.species}</Chip>
              <Chip tone="primary">Lv {vitals.level}</Chip>
              <Chip tone="arcade">{STAGE_LABELS[vitals.evoStage - 1]}</Chip>
            </div>
            {species && (
              <div className="border-t-2 border-ink px-5 py-4 text-sm text-muted-foreground italic">"{species.lore}"</div>
            )}
          </section>

          {/* Vitals + actions */}
          <section className="space-y-6">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{pet.name}</h1>
              <p className="mt-2 font-mono-ui text-[12px] text-muted-foreground break-all">
                hatched {new Date(pet.hatchedAt).toLocaleString()} · tx {pet.txHash}
              </p>
              <p className="mt-1 font-mono-ui text-[11px] text-muted-foreground">
                {wins} wins · {events.length} on-chain events
              </p>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
              <div className="font-mono-ui text-[11px] uppercase text-muted-foreground">vitals</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Meter label="❤ Health" value={vitals.health} tone="success" />
                <Meter label="✨ Happiness" value={vitals.happiness} tone="primary" />
                <Meter label="🍖 Hunger" value={vitals.hunger} tone="warning" />
                <Meter label="⚡ Energy" value={vitals.energy} tone="primary" />
                <Meter label="💞 Bond" value={vitals.bond} tone="success" />
                <Meter label="✦ XP" value={(vitals.xp / (vitals.level * 100)) * 100} tone="primary" />
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
              <div className="flex justify-between font-mono-ui text-[11px] uppercase text-muted-foreground">
                <span>combat stats</span>
                <span className="text-ink">XP {vitals.xp} / {vitals.level * 100}</span>
              </div>
              <StatBar label="HP" value={pet.stats.hp} max={300} tone="primary" />
              <StatBar label="Strength" value={pet.stats.str} max={45} tone="warning" />
              <StatBar label="Agility" value={pet.stats.agi} max={45} tone="arcade" />
              <StatBar label="Intellect" value={pet.stats.int} max={45} tone="success" />
            </div>

            {/* Skill tree */}
            {species && (
              <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5">
                <div className="flex justify-between font-mono-ui text-[11px] uppercase text-muted-foreground mb-3">
                  <span>signature skill tree</span>
                  <span>{vitals.evoStage >= 2 ? "skills unlocked" : "unlocks at stage 2"}</span>
                </div>
                <ul className="space-y-2">
                  {skillTree.map((sk) => {
                    const unlocked = vitals.evoStage >= sk.unlockStage;
                    return (
                      <li key={sk.id} className={`rounded-lg border-2 border-ink px-3 py-2.5 ${unlocked ? "bg-background" : "bg-muted opacity-60"}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-display text-sm flex items-center gap-2">
                            <span className="text-base">{sk.kind === "ultimate" ? "💥" : sk.kind === "skill" ? "🌀" : "•"}</span>
                            {sk.name}
                          </div>
                          <span className="font-mono-ui text-[10px] text-muted-foreground">PWR {sk.power} · EN {sk.energyCost} · {sk.kind}</span>
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-1">{sk.description}</div>
                        {!unlocked && <div className="font-mono-ui text-[10px] mt-1 text-warning">🔒 unlocks at stage {sk.unlockStage}</div>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Evolution tree (5 stages) */}
            <div className="rounded-2xl border-2 border-ink bg-ink text-background shadow-[var(--shadow-card)] p-5">
              <div className="flex justify-between font-mono-ui text-[11px] uppercase opacity-70">
                <span>evolution chain</span>
                <span>{vitals.evoProgress.toFixed(0)}% to next form</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {STAGE_LABELS.map((s, i) => {
                  const idx = i + 1;
                  const reached = idx <= vitals.evoStage;
                  const current = idx === vitals.evoStage;
                  return (
                    <div key={s} className="flex-1">
                      <div className={`rounded-md border-2 px-2 py-1.5 text-center font-mono-ui text-[10px] ${reached ? "border-background bg-background text-ink" : "border-background/30 text-background/60"} ${current ? "ring-2 ring-secondary" : ""}`}>
                        {idx}. {s}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 h-2 rounded-full bg-background/15 overflow-hidden">
                <div className="h-full bg-secondary transition-[width] duration-500" style={{ width: `${vitals.evoProgress}%` }} />
              </div>
              {vitals.evoStage < 5 && (
                <div className="mt-3 grid grid-cols-3 gap-2 font-mono-ui text-[10px]">
                  <Req k="LEVEL" cur={vitals.level} req={req.level} />
                  <Req k="BOND" cur={Math.round(vitals.bond)} req={req.bond} />
                  <Req k="WINS" cur={wins} req={req.wins} />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] p-5">
              <div className="font-mono-ui text-[11px] uppercase text-muted-foreground mb-3">care_loop</div>
              <div className="grid grid-cols-2 gap-3">
                <TactileButton variant="secondary" onClick={() => withWallet("feed", () => { feed(pet.id); refresh(pet.id); pop("+28 hunger", "warning"); })}>🍖 Feed</TactileButton>
                <TactileButton variant="ghost" onClick={() => withWallet("play", () => { play(pet.id); refresh(pet.id); pop("+24 happy", "primary"); })}>🎾 Play</TactileButton>
                <TactileButton variant="ghost" onClick={() => withWallet("train", () => { const r = train(pet.id); if (r) { refresh(pet.id); pop("+24 xp", "primary"); } else pop("low energy", "warning"); })}>🏋 Train</TactileButton>
                <TactileButton onClick={() => withWallet("battle", () => navigate({ to: "/arena", search: { pet: pet.id } as never }))}>⚔ Enter Arena</TactileButton>
                <TactileButton
                  variant="ink"
                  className="col-span-2"
                  disabled={!evoOk}
                  onClick={() => withWallet("evolve", () => { const r = evolve(pet.id, wins); if (r) { refresh(pet.id); pop("EVOLVED!", "success"); } })}
                >
                  🧬 {vitals.evoStage >= 5 ? "Max evolution reached" : evoOk ? `Evolve → ${STAGE_LABELS[vitals.evoStage]}` : `Evolve (${vitals.evoProgress.toFixed(0)}% · need lv ${req.level} / bond ${req.bond} / ${req.wins} wins)`}
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
            <div className="p-8 text-center text-muted-foreground font-mono-ui text-[12px]">No history yet.</div>
          ) : (
            <ol className="divide-y-2 divide-ink/5 max-h-[420px] overflow-auto">
              {events.map((e) => (
                <li key={e.id} className="grid grid-cols-[24px_1fr_auto] items-start gap-4 px-5 py-3.5">
                  <span className="mt-1.5 inline-block h-3 w-3 rounded-full border-2 border-ink" style={{ background: kindColor(e.kind) }} />
                  <div>
                    <div className="font-mono-ui text-[11px] uppercase text-muted-foreground">{e.kind}</div>
                    <div className="text-sm">{e.detail}</div>
                    <div className="font-mono-ui text-[10px] text-muted-foreground mt-0.5 break-all">tx {e.txHash}</div>
                  </div>
                  <div className="font-mono-ui text-[11px] tabular-nums text-muted-foreground whitespace-nowrap">{timeAgo(e.at)}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}

function buildSkillTree(signature: Skill): Skill[] {
  // Derive a 3-rung tree from the signature: a basic, the signature, and an ultimate variant.
  const basic: Skill = signature.kind === "basic" ? signature : { id: "basic-strike", name: "Basic Strike", kind: "basic", power: 12, energyCost: 0, unlockStage: 1, description: "Standard attack. Refills 1 EN." };
  const middle: Skill = signature.kind === "skill" ? signature : { id: signature.id + "-skill", name: signature.name + " (skill)", kind: "skill", power: Math.round(signature.power * 0.7), energyCost: 3, unlockStage: 2, description: "Charged variant of the signature move." };
  const ult: Skill = signature.kind === "ultimate" ? signature : { id: signature.id + "-ult", name: signature.name + " : Apex", kind: "ultimate", power: Math.round(signature.power * 2.2), energyCost: 6, unlockStage: 3, description: "Apex form unlocked at stage 3." };
  return [basic, middle, ult];
}

function stageFilter(stage: number): string | undefined {
  if (stage <= 1) return undefined;
  if (stage === 2) return "drop-shadow(0 0 8px oklch(0.62 0.2 256 / 0.5))";
  if (stage === 3) return "drop-shadow(0 0 12px oklch(0.66 0.22 293 / 0.7))";
  if (stage === 4) return "drop-shadow(0 0 16px oklch(0.78 0.16 75 / 0.85)) saturate(1.1)";
  return "drop-shadow(0 0 24px oklch(0.66 0.22 293 / 0.95)) saturate(1.2) brightness(1.05)";
}

function Req({ k, cur, req }: { k: string; cur: number; req: number }) {
  const ok = cur >= req;
  return (
    <div className={`rounded-md border-2 px-2 py-1.5 text-center ${ok ? "border-success bg-success/20" : "border-background/30"}`}>
      <div className="opacity-70">{k}</div>
      <div className="text-base tabular-nums">{cur}/{req}</div>
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
    case "train": return "var(--accent)";
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
