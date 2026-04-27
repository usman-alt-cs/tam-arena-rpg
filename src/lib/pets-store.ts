// Lightweight client-side "minted pet" store. Source of truth for owned pets.
// Now backed by the species catalog so each minted pet maps to a real Species.
import {
  pickSpeciesByRarity,
  rollRarityFromEgg,
  RARITY_MULT,
  type EggTier,
  type Rarity,
  type Species,
  ROSTER,
} from "./species-catalog";

// Re-export for back-compat with older code that imports from pets-store.
export type { Rarity } from "./species-catalog";

export const RARITY_ODDS: { rarity: Rarity; pct: number; tone: string }[] = [
  { rarity: "Common", pct: 55, tone: "bg-muted text-ink" },
  { rarity: "Rare", pct: 25, tone: "bg-arcade text-background" },
  { rarity: "Epic", pct: 12, tone: "bg-primary text-primary-foreground" },
  { rarity: "Legendary", pct: 6, tone: "bg-warning text-ink" },
  { rarity: "Mythic", pct: 2, tone: "bg-ink text-background" },
];

export interface Pet {
  id: string;
  name: string;
  speciesId: string;
  species: string;       // display label
  sprite: string;
  rarity: Rarity;
  element: string;
  stats: { str: number; agi: number; int: number; hp: number };
  hatchedAt: number;
  txHash: string;
  /** Tier of egg the pet hatched from. */
  eggTier?: EggTier;
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

function roll(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function makeFromSpecies(species: Species, rarity: Rarity, eggTier?: EggTier): Pet {
  const m = RARITY_MULT[rarity];
  const id = `pet_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const txHash =
    "0x" + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("") + "…";
  return {
    id,
    name: `${species.name.split(" ")[0]}-${id.slice(-3).toUpperCase()}`,
    speciesId: species.id,
    species: species.name,
    sprite: species.sprite,
    rarity,
    element: species.element,
    stats: {
      str: Math.round((species.base.str + roll(-1, 2)) * m),
      agi: Math.round((species.base.agi + roll(-1, 2)) * m),
      int: Math.round((species.base.int + roll(-1, 2)) * m),
      hp: Math.round((species.base.hp + roll(-4, 8)) * m),
    },
    hatchedAt: Date.now(),
    txHash,
    eggTier,
  };
}

/** Hatch from a specific egg tier. */
export function mintFromEgg(tier: EggTier, luckBoost = 0): Pet {
  const rarity = rollRarityFromEgg(tier, luckBoost);
  const species = pickSpeciesByRarity(rarity);
  return makeFromSpecies(species, rarity, tier);
}

/** Back-compat for code paths still calling mintPet() — uses old odds. */
export function mintPet(): Pet {
  const r = Math.random() * 100;
  let acc = 0;
  let rarity: Rarity = "Common";
  for (const o of RARITY_ODDS) {
    acc += o.pct;
    if (r <= acc) { rarity = o.rarity; break; }
  }
  const species = pickSpeciesByRarity(rarity);
  return makeFromSpecies(species, rarity);
}

/** Convenience: lookup species def for a pet (for combat skills, lore, etc.). */
export function speciesOf(pet: Pet): Species | undefined {
  return ROSTER.find((s) => s.id === pet.speciesId);
}
