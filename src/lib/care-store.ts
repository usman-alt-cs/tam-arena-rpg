// Per-pet vitals + care timeline. Decays over time (mock).
import { getPet, loadPets, type Pet } from "./pets-store";

export type CareKind = "hatch" | "feed" | "play" | "battle" | "evolve";

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
  health: number; // 0..100
  happiness: number; // 0..100
  hunger: number; // 0..100 (lower = more hungry)
  xp: number;
  level: number;
  evoStage: number; // 1..3
  evoProgress: number; // 0..100 toward next stage
  lastTick: number;
}

const VKEY = "tam.vitals.v1";
const EKEY = "tam.events.v1";

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
  return (
    "0x" +
    Array.from({ length: 10 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  );
}

function defaultVitals(petId: string): PetVitals {
  return {
    petId,
    health: 100,
    happiness: 80,
    hunger: 70,
    xp: 0,
    level: 1,
    evoStage: 1,
    evoProgress: 5,
    lastTick: Date.now(),
  };
}

/** Apply natural decay since lastTick. */
function decay(v: PetVitals): PetVitals {
  const minutes = Math.max(0, (Date.now() - v.lastTick) / 60000);
  const drop = Math.min(40, minutes * 0.6);
  return {
    ...v,
    hunger: Math.max(0, v.hunger - drop),
    happiness: Math.max(0, v.happiness - drop * 0.5),
    health: Math.max(20, v.health - drop * 0.2),
    lastTick: Date.now(),
  };
}

export function getVitals(petId: string): PetVitals {
  const all = loadAllVitals();
  let v = all[petId];
  if (!v) {
    v = defaultVitals(petId);
    // seed from hatch event if pet exists
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
  return loadEvents()
    .filter((e) => e.petId === petId)
    .sort((a, b) => b.at - a.at);
}

export function addEvent(petId: string, kind: CareKind, detail: string, txHash?: string): CareEvent {
  const evt: CareEvent = {
    id: `evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    petId,
    kind,
    at: Date.now(),
    detail,
    txHash: txHash ?? tx(),
  };
  const all = loadEvents();
  all.unshift(evt);
  saveEvents(all);
  return evt;
}

function bumpXp(v: PetVitals, amt: number): PetVitals {
  let xp = v.xp + amt;
  let level = v.level;
  let evoProgress = v.evoProgress + amt * 0.6;
  let evoStage = v.evoStage;
  while (xp >= level * 100) {
    xp -= level * 100;
    level += 1;
  }
  if (evoProgress >= 100 && evoStage < 3) {
    evoProgress = 0;
    evoStage += 1;
  } else if (evoProgress > 100) {
    evoProgress = 100;
  }
  return { ...v, xp, level, evoProgress, evoStage };
}

export function feed(petId: string): { vitals: PetVitals; event: CareEvent } {
  let v = getVitals(petId);
  v = { ...v, hunger: Math.min(100, v.hunger + 28), happiness: Math.min(100, v.happiness + 6), health: Math.min(100, v.health + 4) };
  v = bumpXp(v, 12);
  setVitals(v);
  const evt = addEvent(petId, "feed", "+28 hunger · +12 xp");
  return { vitals: v, event: evt };
}

export function play(petId: string): { vitals: PetVitals; event: CareEvent } {
  let v = getVitals(petId);
  v = { ...v, happiness: Math.min(100, v.happiness + 24), hunger: Math.max(0, v.hunger - 6) };
  v = bumpXp(v, 18);
  setVitals(v);
  const evt = addEvent(petId, "play", "+24 happiness · +18 xp");
  return { vitals: v, event: evt };
}

export function evolve(petId: string): { vitals: PetVitals; event: CareEvent } | null {
  let v = getVitals(petId);
  if (v.evoProgress < 100 || v.evoStage >= 3) return null;
  v = { ...v, evoStage: v.evoStage + 1, evoProgress: 0 };
  setVitals(v);
  const evt = addEvent(petId, "evolve", `Evolved to stage ${v.evoStage}`);
  return { vitals: v, event: evt };
}

export function recordBattle(petId: string, opponent: string, result: "win" | "lose" | "draw", detail: string): { vitals: PetVitals; event: CareEvent } {
  let v = getVitals(petId);
  const xp = result === "win" ? 35 : result === "draw" ? 12 : 5;
  const happyDelta = result === "win" ? 10 : result === "lose" ? -8 : 0;
  v = {
    ...v,
    happiness: Math.max(0, Math.min(100, v.happiness + happyDelta)),
    health: Math.max(10, v.health - (result === "lose" ? 12 : 4)),
  };
  v = bumpXp(v, xp);
  setVitals(v);
  const evt = addEvent(petId, "battle", `vs ${opponent} · ${result.toUpperCase()} · ${detail} · +${xp} xp`);
  return { vitals: v, event: evt };
}

export function firstOwnedPet(): Pet | null {
  return loadPets()[0] ?? null;
}
