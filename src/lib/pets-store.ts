// Lightweight client-side "minted pet" store. No backend — survives reloads via localStorage.
import petPurple from "@/assets/pet-purple.png";
import petPink from "@/assets/pet-pink.png";
import petLegendary from "@/assets/pet-legendary.png";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const RARITY_ODDS: { rarity: Rarity; pct: number; tone: string }[] = [
  { rarity: "Common", pct: 60, tone: "bg-muted text-ink" },
  { rarity: "Uncommon", pct: 25, tone: "bg-success text-ink" },
  { rarity: "Rare", pct: 10, tone: "bg-accent text-accent-foreground" },
  { rarity: "Epic", pct: 4, tone: "bg-primary text-primary-foreground" },
  { rarity: "Legendary", pct: 1, tone: "bg-warning text-ink" },
];

const SPECIES_POOL: { name: string; sprite: string; element: string }[] = [
  { name: "Vyrn", sprite: petPurple, element: "Void" },
  { name: "Mira", sprite: petPink, element: "Spark" },
  { name: "Rexor", sprite: petLegendary, element: "Cyber" },
];

export interface Pet {
  id: string;
  name: string;
  species: string;
  sprite: string;
  rarity: Rarity;
  element: string;
  stats: { str: number; agi: number; int: number; hp: number };
  hatchedAt: number;
  txHash: string;
}

const KEY = "tam.pets.v1";

export function loadPets(): Pet[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePet(pet: Pet) {
  const all = loadPets();
  all.unshift(pet);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getPet(id: string): Pet | undefined {
  return loadPets().find((p) => p.id === id);
}

function rollRarity(): Rarity {
  const r = Math.random() * 100;
  let acc = 0;
  for (const o of RARITY_ODDS) {
    acc += o.pct;
    if (r <= acc) return o.rarity;
  }
  return "Common";
}

const RARITY_MULT: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.15,
  Rare: 1.35,
  Epic: 1.6,
  Legendary: 2,
};

function roll(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function mintPet(): Pet {
  const rarity = rollRarity();
  const m = RARITY_MULT[rarity];
  const species = SPECIES_POOL[roll(0, SPECIES_POOL.length - 1)];
  const id = `pet_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const txHash =
    "0x" +
    Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("") +
    "…";
  return {
    id,
    name: `${species.name}-${id.slice(-3).toUpperCase()}`,
    species: species.name,
    sprite: species.sprite,
    rarity,
    element: species.element,
    stats: {
      str: Math.round(roll(8, 14) * m),
      agi: Math.round(roll(8, 14) * m),
      int: Math.round(roll(8, 14) * m),
      hp: Math.round(roll(80, 110) * m),
    },
    hatchedAt: Date.now(),
    txHash,
  };
}
