// Tactical-lite combat engine.
// Pure functions. UI layers handle animation. No localStorage here.

import {
  elementAdvantage,
  type Element,
  type Skill,
  type StatusKind,
} from "./species-catalog";

export type MoveKind = "basic" | "skill" | "ultimate" | "defend";

export interface Combatant {
  name: string;
  sprite: string;
  element: Element;
  hp: number;
  maxHp: number;
  energy: number;        // 0..6
  maxEnergy: number;
  shieldPct: number;     // 0..1, defensive multiplier active for next hit
  statuses: { kind: StatusKind; turns: number }[];
  /** Damage scaling from training. */
  power: number;         // 0.7..1.6 multiplier
  skills: Skill[];       // must contain at least: basic, skill (optional), ultimate (optional)
}

export interface ResolvedAction {
  attacker: "p" | "o";
  move: MoveKind;
  skill?: Skill;
  damage: number;
  crit: boolean;
  multiplier: number;
  statusApplied?: StatusKind;
  healed?: number;
  text: string; // human-readable log line
}

export const STATUS_LABEL: Record<StatusKind, { label: string; tone: string; glyph: string }> = {
  burn: { label: "Burn", tone: "text-warning", glyph: "🔥" },
  freeze: { label: "Freeze", tone: "text-arcade", glyph: "❄" },
  shock: { label: "Shock", tone: "text-secondary", glyph: "⚡" },
};

const STATUS_DOT: Record<StatusKind, number> = {
  burn: 6,
  freeze: 0,
  shock: 4,
};

function roll(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Run one player move, then opponent picks a response. Returns both actions in order. */
export function resolveTurn(
  player: Combatant,
  foe: Combatant,
  pMove: MoveKind,
  pSkill?: Skill,
): { player: Combatant; foe: Combatant; actions: ResolvedAction[] } {
  const actions: ResolvedAction[] = [];

  // Player acts first
  let { attacker: p1, defender: f1, action: a1 } = applyMove(player, foe, "p", pMove, pSkill);
  actions.push(a1);

  // Apply DoT for both at end of player's mini-turn (simplified)
  const t1 = tickStatuses(p1);
  p1 = t1.combatant;
  if (t1.dotDamage > 0) actions.push(t1.action);

  // Foe AI: pick a move
  const aiPick = pickAiMove(f1, p1);
  const { attacker: f2, defender: p2, action: a2 } = applyMove(f1, p1, "o", aiPick.kind, aiPick.skill);
  actions.push(a2);

  const t2 = tickStatuses(f2);
  const finalFoe = t2.combatant;
  if (t2.dotDamage > 0) actions.push(t2.action);

  return { player: p2, foe: finalFoe, actions };
}

function pickAiMove(self: Combatant, opp: Combatant): { kind: MoveKind; skill?: Skill } {
  // Prefer ultimate at full energy + low opp HP
  if (self.energy >= 6 && opp.hp < opp.maxHp * 0.5) {
    const ult = self.skills.find((s) => s.kind === "ultimate");
    if (ult) return { kind: "ultimate", skill: ult };
  }
  if (self.energy >= 3 && Math.random() < 0.55) {
    const skill = self.skills.find((s) => s.kind === "skill");
    if (skill) return { kind: "skill", skill };
  }
  if (self.hp < self.maxHp * 0.3 && Math.random() < 0.4) {
    return { kind: "defend" };
  }
  const basic = self.skills.find((s) => s.kind === "basic")!;
  return { kind: "basic", skill: basic };
}

function applyMove(
  attacker: Combatant,
  defender: Combatant,
  who: "p" | "o",
  kind: MoveKind,
  skill?: Skill,
): { attacker: Combatant; defender: Combatant; action: ResolvedAction } {
  // Frozen? Skip turn.
  if (attacker.statuses.some((s) => s.kind === "freeze")) {
    return {
      attacker,
      defender,
      action: {
        attacker: who,
        move: kind,
        damage: 0,
        crit: false,
        multiplier: 0,
        text: `${attacker.name} is frozen and can't move!`,
      },
    };
  }

  if (kind === "defend") {
    return {
      attacker: { ...attacker, shieldPct: 0.55, energy: Math.min(attacker.maxEnergy, attacker.energy + 2) },
      defender,
      action: { attacker: who, move: kind, damage: 0, crit: false, multiplier: 0, text: `${attacker.name} braces. Shield 55% · +2 EN` },
    };
  }

  if (!skill) skill = attacker.skills.find((s) => s.kind === "basic")!;

  // Insufficient energy → fall back to basic
  if (attacker.energy < skill.energyCost) {
    skill = attacker.skills.find((s) => s.kind === "basic")!;
    kind = "basic";
  }

  const elMult = elementAdvantage(attacker.element, defender.element);
  const crit = Math.random() < 0.18;
  const variance = 0.85 + Math.random() * 0.3;
  const base = skill.power * attacker.power * variance * elMult * (crit ? 1.6 : 1);
  const incoming = base * (1 - defender.shieldPct);
  const damage = Math.max(1, Math.round(incoming));

  // Energy economy: basic refills 1, skill consumes, ultimate consumes all.
  const energyDelta = skill.kind === "basic" ? 1 : -skill.energyCost;
  let healed = 0;
  if (skill.id === "splash-rebound") healed = 4;
  if (skill.id === "rebirth-flare") healed = 12;

  const newAttacker: Combatant = {
    ...attacker,
    energy: Math.max(0, Math.min(attacker.maxEnergy, attacker.energy + energyDelta)),
    hp: Math.min(attacker.maxHp, attacker.hp + healed),
    shieldPct: 0,
  };

  // Apply status
  let newStatuses = defender.statuses;
  let statusApplied: StatusKind | undefined;
  if (skill.status && Math.random() < 0.6 && !newStatuses.some((s) => s.kind === skill!.status)) {
    newStatuses = [...newStatuses, { kind: skill.status, turns: skill.status === "freeze" ? 1 : 2 }];
    statusApplied = skill.status;
  }

  const newDefender: Combatant = {
    ...defender,
    hp: Math.max(0, defender.hp - damage),
    statuses: newStatuses,
    shieldPct: 0,
  };

  const txt =
    `${attacker.name} → ${skill.name}` +
    (crit ? " · CRIT" : "") +
    (elMult > 1 ? " · super effective" : elMult < 1 ? " · resisted" : "") +
    ` · ${damage} dmg` +
    (statusApplied ? ` · +${STATUS_LABEL[statusApplied].label}` : "") +
    (healed > 0 ? ` · +${healed} HP` : "");

  return {
    attacker: newAttacker,
    defender: newDefender,
    action: {
      attacker: who,
      move: kind,
      skill,
      damage,
      crit,
      multiplier: elMult,
      statusApplied,
      healed,
      text: txt,
    },
  };
}

function tickStatuses(c: Combatant): { combatant: Combatant; dotDamage: number; action: ResolvedAction } {
  let dot = 0;
  const next = c.statuses
    .map((s) => {
      dot += STATUS_DOT[s.kind];
      return { ...s, turns: s.turns - 1 };
    })
    .filter((s) => s.turns > 0);

  return {
    combatant: { ...c, statuses: next, hp: Math.max(0, c.hp - dot) },
    dotDamage: dot,
    action: dot > 0
      ? {
          attacker: "p",
          move: "basic",
          damage: dot,
          crit: false,
          multiplier: 1,
          text: `Status tick · -${dot} HP`,
        }
      : { attacker: "p", move: "basic", damage: 0, crit: false, multiplier: 1, text: "" },
  };
}

export function makeCombatant(opts: {
  name: string;
  sprite: string;
  element: Element;
  hp: number;
  power?: number;
  skills: Skill[];
}): Combatant {
  return {
    name: opts.name,
    sprite: opts.sprite,
    element: opts.element,
    hp: opts.hp,
    maxHp: opts.hp,
    energy: 2,
    maxEnergy: 6,
    shieldPct: 0,
    statuses: [],
    power: opts.power ?? 1,
    skills: opts.skills,
  };
}

export { roll };
