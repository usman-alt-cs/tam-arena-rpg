// Per-pet vitals + care timeline. 5-stage evolution.
import { getPet, loadPets, type Pet } from "./pets-store";

export type CareKind = "hatch" | "feed" | "play" | "battle" | "evolve" | "train";

export interface CareEvent {
  id: string;
  petId: string;
  kind: CareKind;
  at: number;
  detail: string;
  txHash: string;
}

export interface PetVitals {
  petId: string;
  health: number;        // 0..100
  happiness: number;     // 0..100
  hunger: number;        // 0..100
  bond: number;          // 0..100, slow-rising affection
  energy: number;        // 0..100, regen for combat
  xp: number;
  level: number;
  evoStage: number;      // 1..5
  evoProgress: number;   // 0..100 toward next stage
  lastTick: number;
}

const VKEY = "tam.vitals.v2";
const EKEY = "tam.events.v1";

export const STAGE_LABELS = ["Baby", "Young", "Mature", "Elite", "Ascended"];

export function stageRequirement(stage: number): { level: number; bond: number; wins: number } {
  switch (stage) {
    case 1: return { level: 3, bond: 25, wins: 0 };
    case 2: return { level: 8, bond: 45, wins: 2 };
    case 3: return { level: 15, bond: 65, wins: 6 };
    case 4: return { level: 25, bond: 85, wins: 14 };
    default: return { level: 99, bond: 100, wins: 99 };
  }
}

function loadAllVitals(): Record<string, PetVitals> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(VKEY) || "{}");
  } catch {
    return {};
  }
}
function saveAllVitals(v: Record<string, PetVitals>) {
  localStorage.setItem(VKEY, JSON.stringify(v));
}
function loadEvents(): CareEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(EKEY) || "[]");
  } catch {
    return [];
  }
}
function saveEvents(e: CareEvent[]) {
  localStorage.setItem(EKEY, JSON.stringify(e.slice(0, 200)));
}

function tx() {
  return "0x" + Array.from({ length: 10 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function defaultVitals(petId: string): PetVitals {
  return {
    petId,
    health: 100,
    happiness: 80,
    hunger: 70,
    bond: 10,
    energy: 100,
    xp: 0,
    level: 1,
    evoStage: 1,
    evoProgress: 0,
    lastTick: Date.now(),
  };
}

function decay(v: PetVitals): PetVitals {
  const minutes = Math.max(0, (Date.now() - v.lastTick) / 60000);
  const drop = Math.min(40, minutes * 0.6);
  return {
    ...v,
    hunger: Math.max(0, v.hunger - drop),
    happiness: Math.max(0, v.happiness - drop * 0.5),
    health: Math.max(20, v.health - drop * 0.2),
    energy: Math.min(100, v.energy + minutes * 2),
    lastTick: Date.now(),
  };
}

export function getVitals(petId: string): PetVitals {
  const all = loadAllVitals();
  let v = all[petId];
  if (!v) {
    v = defaultVitals(petId);
    const pet = getPet(petId);
    if (pet) addEvent(petId, "hatch", `Hatched as ${pet.rarity} ${pet.species}`, pet.txHash);
  } else {
    v = decay(v);
  }
  all[petId] = v;
  saveAllVitals(all);
  return v;
}

function setVitals(v: PetVitals) {
  const all = loadAllVitals();
  all[v.petId] = v;
  saveAllVitals(all);
}

export function listEvents(petId: string): CareEvent[] {
  return loadEvents().filter((e) => e.petId === petId).sort((a, b) => b.at - a.at);
}

export function addEvent(petId: string, kind: CareKind, detail: string, txHash?: string): CareEvent {
  const evt: CareEvent = {
    id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    petId, kind, at: Date.now(), detail, txHash: txHash ?? tx(),
  };
  const all = loadEvents();
  all.unshift(evt);
  saveEvents(all);
  return evt;
}

function bumpXp(v: PetVitals, amt: number): PetVitals {
  let xp = v.xp + amt;
  let level = v.level;
  let evoProgress = v.evoProgress + amt * 0.5;
  while (xp >= level * 100) {
    xp -= level * 100;
    level += 1;
  }
  evoProgress = Math.min(100, evoProgress);
  return { ...v, xp, level, evoProgress };
}

export function feed(petId: string) {
  let v = getVitals(petId);
  v = { ...v, hunger: Math.min(100, v.hunger + 28), happiness: Math.min(100, v.happiness + 6), health: Math.min(100, v.health + 4), bond: Math.min(100, v.bond + 2) };
  v = bumpXp(v, 12);
  setVitals(v);
  return { vitals: v, event: addEvent(petId, "feed", "+28 hunger · +12 xp · +2 bond") };
}

export function play(petId: string) {
  let v = getVitals(petId);
  v = { ...v, happiness: Math.min(100, v.happiness + 24), hunger: Math.max(0, v.hunger - 6), bond: Math.min(100, v.bond + 4) };
  v = bumpXp(v, 18);
  setVitals(v);
  return { vitals: v, event: addEvent(petId, "play", "+24 happiness · +18 xp · +4 bond") };
}

export function train(petId: string) {
  let v = getVitals(petId);
  if (v.energy < 25) return null;
  v = { ...v, energy: Math.max(0, v.energy - 25), happiness: Math.max(0, v.happiness - 4) };
  v = bumpXp(v, 24);
  setVitals(v);
  return { vitals: v, event: addEvent(petId, "train", "+24 xp · -25 energy") };
}

/** Check if a stage transition is currently allowed. */
export function canEvolve(v: PetVitals, winsCount: number): boolean {
  if (v.evoStage >= 5) return false;
  if (v.evoProgress < 100) return false;
  const req = stageRequirement(v.evoStage);
  return v.level >= req.level && v.bond >= req.bond && winsCount >= req.wins;
}

export function evolve(petId: string, winsCount: number) {
  let v = getVitals(petId);
  if (!canEvolve(v, winsCount)) return null;
  v = { ...v, evoStage: v.evoStage + 1, evoProgress: 0, health: 100, happiness: Math.min(100, v.happiness + 10) };
  setVitals(v);
  return { vitals: v, event: addEvent(petId, "evolve", `Evolved → ${STAGE_LABELS[v.evoStage - 1]}`) };
}

export function recordBattle(petId: string, opponent: string, result: "win" | "lose" | "draw", detail: string) {
  let v = getVitals(petId);
  const xp = result === "win" ? 35 : result === "draw" ? 12 : 5;
  const happyDelta = result === "win" ? 10 : result === "lose" ? -8 : 0;
  v = {
    ...v,
    happiness: Math.max(0, Math.min(100, v.happiness + happyDelta)),
    health: Math.max(10, v.health - (result === "lose" ? 12 : 4)),
    bond: Math.min(100, v.bond + (result === "win" ? 3 : 1)),
    energy: Math.max(0, v.energy - 20),
  };
  v = bumpXp(v, xp);
  setVitals(v);
  return { vitals: v, event: addEvent(petId, "battle", `vs ${opponent} · ${result.toUpperCase()} · ${detail} · +${xp} xp`) };
}

export function firstOwnedPet(): Pet | null {
  return loadPets()[0] ?? null;
}

/** Count battle wins for a pet from event log. */
export function winsFor(petId: string): number {
  return listEvents(petId).filter((e) => e.kind === "battle" && / WIN /.test(` ${e.detail} `)).length;
}
