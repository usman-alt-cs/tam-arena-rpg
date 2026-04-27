import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/tam/SiteHeader";
import { TactileButton } from "@/components/tam/TactileButton";
import { Chip } from "@/components/tam/Chip";
import { StatBar } from "@/components/tam/StatBar";
import { getPet, loadPets, speciesOf } from "@/lib/pets-store";
import { getVitals, recordBattle } from "@/lib/care-store";
import { useRequireWallet } from "@/hooks/use-wallet";
import {
  ELEMENT_GLYPH, ELEMENT_TONE, ROSTER, type Element,
} from "@/lib/species-catalog";
import {
  makeCombatant, resolveTurn, STATUS_LABEL,
  type Combatant, type MoveKind, type ResolvedAction,
} from "@/lib/combat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/arena")({
  validateSearch: (s) => ({ pet: (s.pet as string) ?? "" }),
  head: () => ({
    meta: [
      { title: "Arena — Tam Arena" },
      { name: "description", content: "Tactical pet combat: HP, energy, four moves, four elements, status effects, ultimate cinematics." },
    ],
  }),
  component: ArenaPage,
});

function ArenaPage() {
  const search = useSearch({ from: "/arena" });
  const requireWallet = useRequireWallet();

  const playerPet = useMemo(() => {
    if (search.pet) return getPet(search.pet);
    return loadPets()[0];
  }, [search.pet]);

  const playerSpecies = playerPet ? speciesOf(playerPet) : undefined;

  const [foeSpecies] = useState(() => {
    const pool = ROSTER.filter((s) => s.rarity !== "Mythic");
    return pool[Math.floor(Math.random() * pool.length)];
  });

  const [player, setPlayer] = useState<Combatant | null>(null);
  const [foe, setFoe] = useState<Combatant | null>(null);
  const [log, setLog] = useState<ResolvedAction[]>([]);
  const [pop, setPop] = useState<{ to: "p" | "o"; amt: number; crit: boolean; id: number } | null>(null);
  const [shake, setShake] = useState<"p" | "o" | null>(null);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<"win" | "lose" | "draw" | null>(null);
  const [ultFx, setUltFx] = useState(false);

  const vitals = playerPet ? getVitals(playerPet.id) : null;
  const skillUnlocked = (vitals?.evoStage ?? 1) >= 2;
  const ultUnlocked = (vitals?.evoStage ?? 1) >= 3;

  useEffect(() => {
    if (!playerPet || !playerSpecies) return;
    setPlayer(makeCombatant({
      name: playerPet.name,
      sprite: playerPet.sprite,
      element: playerSpecies.element,
      hp: playerPet.stats.hp,
      power: 0.85 + (vitals?.level ?? 1) * 0.04,
      skills: deriveSkills(playerSpecies.signature),
    }));
    setFoe(makeCombatant({
      name: foeSpecies.name,
      sprite: foeSpecies.sprite,
      element: foeSpecies.element,
      hp: Math.round(foeSpecies.base.hp * 1.2),
      power: 1,
      skills: deriveSkills(foeSpecies.signature),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerPet?.id]);

  function play(kind: MoveKind) {
    if (!player || !foe || pending || outcome) return;
    const proceed = requireWallet({
      action: "battle", redirect: `/arena?pet=${playerPet?.id ?? ""}`,
      run: () => doPlay(kind),
    });
    if (!proceed) return;
  }

  function doPlay(kind: MoveKind) {
    if (!player || !foe) return;
    setPending(true);
    const skill = kind === "ultimate" ? player.skills.find((s) => s.kind === "ultimate")
      : kind === "skill" ? player.skills.find((s) => s.kind === "skill")
      : player.skills.find((s) => s.kind === "basic");
    if (kind === "ultimate") {
      setUltFx(true);
      setTimeout(() => setUltFx(false), 900);
    }
    const r = resolveTurn(player, foe, kind, skill);
    setPlayer(r.player);
    setFoe(r.foe);
    setLog((l) => [...r.actions.filter((a) => a.text), ...l].slice(0, 10));

    // Damage popups + shake based on first damaging action
    for (const a of r.actions) {
      if (a.damage > 0 && a.attacker === "p") {
        setShake("o"); setPop({ to: "o", amt: a.damage, crit: a.crit, id: Date.now() });
        setTimeout(() => setShake(null), 350);
        break;
      }
    }
    setTimeout(() => {
      for (const a of r.actions) {
        if (a.damage > 0 && a.attacker === "o") {
          setShake("p"); setPop({ to: "p", amt: a.damage, crit: a.crit, id: Date.now() + 1 });
          setTimeout(() => setShake(null), 350);
          break;
        }
      }
    }, 380);

    setTimeout(() => {
      if (r.foe.hp <= 0 && r.player.hp <= 0) finalize("draw");
      else if (r.foe.hp <= 0) finalize("win");
      else if (r.player.hp <= 0) finalize("lose");
      setPending(false);
    }, 700);
  }

  function finalize(result: "win" | "lose" | "draw") {
    setOutcome(result);
    if (playerPet) recordBattle(playerPet.id, foeSpecies.name, result, `${player?.name} vs ${foeSpecies.name}`);
  }

  if (!playerPet) {
    return (
      <div className="min-h-screen bg-background text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl">No pet to fight with</h1>
          <p className="mt-3 text-muted-foreground">Hatch a Tam first to enter the arena.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/hatch"><TactileButton>Hatch a pet</TactileButton></Link>
          </div>
        </main>
      </div>
    );
  }
  if (!player || !foe) return null;

  const stage = vitals?.evoStage ?? 1;

  return (
    <div className="min-h-screen bg-background text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/pets/$petId" params={{ petId: playerPet.id }} className="font-mono-ui text-[12px] text-muted-foreground hover:text-ink">← back to pet</Link>
          <Chip tone="arcade">stage {stage} · {stage >= 2 ? "skill combat" : "RPS only — evolve to unlock"}</Chip>
        </div>

        <h1 className="mt-4 font-display text-4xl sm:text-5xl tracking-tight">Tactical Arena</h1>

        {/* Battlefield */}
        <section className="relative mt-6 rounded-2xl border-2 border-ink bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="grid grid-cols-2 gap-3 bg-background grid-bg p-6 relative">
            {ultFx && <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "radial-gradient(circle, var(--secondary), transparent 70%)", animation: "pet-bounce 0.9s ease-out" }} />}
            <Side c={player} side="left" shake={shake === "p"} pop={pop?.to === "p" ? pop : null} />
            <Side c={foe} side="right" shake={shake === "o"} pop={pop?.to === "o" ? pop : null} flip />
          </div>

          <div className="border-t-2 border-ink px-5 py-4">
            <div className="font-mono-ui text-[11px] text-muted-foreground uppercase mb-2">moves</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <TactileButton variant="ghost" disabled={pending || !!outcome} onClick={() => play("basic")}>
                <span className="flex flex-col"><span>👊 Basic</span><span className="font-mono-ui text-[9px] opacity-70">EN +1</span></span>
              </TactileButton>
              <TactileButton variant="secondary" disabled={pending || !!outcome || !skillUnlocked || player.energy < 3} onClick={() => play("skill")}>
                <span className="flex flex-col"><span>🌀 Skill</span><span className="font-mono-ui text-[9px] opacity-70">EN -3{skillUnlocked ? "" : " · 🔒"}</span></span>
              </TactileButton>
              <TactileButton disabled={pending || !!outcome || !ultUnlocked || player.energy < 6} onClick={() => play("ultimate")}>
                <span className="flex flex-col"><span>💥 Ultimate</span><span className="font-mono-ui text-[9px] opacity-70">EN -6{ultUnlocked ? "" : " · 🔒"}</span></span>
              </TactileButton>
              <TactileButton variant="ink" disabled={pending || !!outcome} onClick={() => play("defend")}>
                <span className="flex flex-col"><span>🛡 Defend</span><span className="font-mono-ui text-[9px] opacity-70">EN +2 · -55% dmg</span></span>
              </TactileButton>
            </div>
            {!skillUnlocked && (
              <p className="mt-3 font-mono-ui text-[11px] text-warning">⚠ Stage 1 pets only have Basic + Defend. Evolve your pet to unlock Skill, then Ultimate at stage 3.</p>
            )}
          </div>
        </section>

        {outcome && (
          <div className={cn("mt-6 rounded-2xl border-2 border-ink p-5 shadow-[var(--shadow-card)] flex flex-wrap items-center justify-between gap-3", outcome === "win" ? "bg-success/20" : outcome === "lose" ? "bg-destructive/15" : "bg-muted")}>
            <div>
              <div className="font-display text-3xl">{outcome === "win" ? "VICTORY" : outcome === "lose" ? "DEFEAT" : "DRAW"}</div>
              <div className="font-mono-ui text-[11px] text-muted-foreground mt-1">
                +{outcome === "win" ? 35 : outcome === "draw" ? 12 : 5} XP recorded on-chain · vs {foeSpecies.name}
              </div>
            </div>
            <div className="flex gap-2">
              <TactileButton onClick={() => location.reload()}>Rematch</TactileButton>
              <Link to="/pets/$petId" params={{ petId: playerPet.id }}><TactileButton variant="ghost">Pet profile</TactileButton></Link>
            </div>
          </div>
        )}

        {/* Battle log */}
        <section className="mt-6 rounded-2xl border-2 border-ink bg-ink text-background p-5 shadow-[var(--shadow-card)]">
          <div className="font-mono-ui text-[11px] uppercase opacity-70 mb-2">battle_log.txt</div>
          {log.length === 0 ? <div className="font-mono-ui text-[12px] opacity-60">Pick a move to start.</div> :
            <ol className="space-y-1 font-mono-ui text-[12px]">
              {log.map((a, i) => (
                <li key={i} className={cn("tabular-nums", a.crit && "text-warning", a.multiplier > 1 && "text-success", a.multiplier < 1 && a.multiplier > 0 && "opacity-70")}>
                  &gt; {a.text}
                </li>
              ))}
            </ol>
          }
        </section>
      </main>
    </div>
  );
}

function Side({ c, side, shake, pop, flip }: { c: Combatant; side: "left" | "right"; shake: boolean; pop: { amt: number; crit: boolean; id: number } | null; flip?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", side === "right" && "items-end text-right")}>
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-display font-semibold text-sm truncate">{c.name}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2 border-ink font-mono-ui text-[10px] uppercase ${ELEMENT_TONE[c.element as Element]}`}>
          {ELEMENT_GLYPH[c.element as Element]} {c.element}
        </span>
      </div>
      <StatBar label={`HP ${c.hp}/${c.maxHp}`} value={(c.hp / c.maxHp) * 100} tone={c.hp > c.maxHp * 0.5 ? "success" : c.hp > c.maxHp * 0.25 ? "warning" : "primary"} />
      <StatBar label={`Energy ${c.energy}/${c.maxEnergy}`} value={(c.energy / c.maxEnergy) * 100} tone="arcade" />
      {c.statuses.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {c.statuses.map((s, i) => (
            <span key={i} className={`font-mono-ui text-[10px] px-1.5 py-0.5 rounded border-2 border-ink ${STATUS_LABEL[s.kind].tone} bg-card`}>
              {STATUS_LABEL[s.kind].glyph} {STATUS_LABEL[s.kind].label} {s.turns}t
            </span>
          ))}
        </div>
      )}
      <div className="relative w-full h-36 sm:h-44 flex items-end justify-center">
        {pop && (
          <span key={pop.id} className={cn("absolute top-0 font-display font-bold pointer-events-none", pop.crit ? "text-warning text-3xl" : "text-destructive text-2xl")} style={{ animation: "pet-bounce 0.7s ease-out forwards" }}>
            -{pop.amt}{pop.crit && "!"}
          </span>
        )}
        <img
          src={c.sprite}
          alt={c.name}
          className={cn("h-32 sm:h-40 w-auto object-contain", !shake && "animate-pet-idle", shake && "animate-[pet-bounce_0.35s_ease-out]", flip && "scale-x-[-1]")}
        />
      </div>
    </div>
  );
}

function deriveSkills(signature: import("@/lib/species-catalog").Skill) {
  const basic = signature.kind === "basic" ? signature : { id: "basic-strike", name: "Basic Strike", kind: "basic" as const, power: 12, energyCost: 0, unlockStage: 1 as const, description: "Standard attack" };
  const skill = signature.kind === "skill" ? signature : { id: signature.id + "-sk", name: signature.name, kind: "skill" as const, power: Math.round(signature.power * 0.7), energyCost: 3, unlockStage: 2 as const, description: signature.description, status: signature.status };
  const ult = signature.kind === "ultimate" ? signature : { id: signature.id + "-ult", name: signature.name + " : Apex", kind: "ultimate" as const, power: Math.round(signature.power * 2.2), energyCost: 6, unlockStage: 3 as const, description: "Apex form", status: signature.status };
  return [basic, skill, ult];
}
