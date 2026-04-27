// Species catalog — source of truth for the pet roster.
// Drives gacha minting, evolution previews, marketplace seeding, and combat.

import flameFox from "@/assets/pets/flame-fox.png";
import aquaSlime from "@/assets/pets/aqua-slime.png";
import leafDrake from "@/assets/pets/leaf-drake.png";
import snowKitten from "@/assets/pets/snow-kitten.png";
import voltBun from "@/assets/pets/volt-bun.png";
import starSprout from "@/assets/pets/star-sprout.png";
import crystalBun from "@/assets/pets/crystal-bun.png";
import shadowPup from "@/assets/pets/shadow-pup.png";
import frostOwl from "@/assets/pets/frost-owl.png";
import lavaSal from "@/assets/pets/lava-sal.png";
import moonCat from "@/assets/pets/moon-cat.png";
import ironDrake from "@/assets/pets/iron-drake.png";
import cyberPanther from "@/assets/pets/cyber-panther.png";
import phoenix from "@/assets/pets/phoenix.png";
import divineLion from "@/assets/pets/divine-lion.png";
import eclipseSerpent from "@/assets/pets/eclipse-serpent.png";
import starDragon from "@/assets/pets/star-dragon.png";
import originTam from "@/assets/pets/origin-tam.png";
import voidEmperor from "@/assets/pets/void-emperor.png";
// Reuse the legacy purple sprite for one extra Epic to keep roster at 20 unique.
import petPurple from "@/assets/pet-purple.png";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export type Element = "Fire" | "Water" | "Nature" | "Light" | "Shadow";

export interface Skill {
  id: string;
  name: string;
  kind: "basic" | "skill" | "ultimate";
  power: number;       // base damage
  energyCost: number;  // 0..6
  /** status applied on hit */
  status?: StatusKind;
  /** unlocks at evolution stage */
  unlockStage: 1 | 2 | 3 | 4 | 5;
  description: string;
}

export type StatusKind = "burn" | "freeze" | "shock";

export interface Species {
  id: string;
  name: string;
  rarity: Rarity;
  element: Element;
  sprite: string;
  lore: string;
  /** stat baseline before rarity multiplier */
  base: { str: number; agi: number; int: number; hp: number };
  signature: Skill;
}

/** Element advantage: returns a damage multiplier for attacker vs defender. */
export function elementAdvantage(att: Element, def: Element): number {
  // Fire > Nature > Water > Fire ; Light <-> Shadow mutual super-effective
  if (att === "Fire" && def === "Nature") return 1.5;
  if (att === "Nature" && def === "Water") return 1.5;
  if (att === "Water" && def === "Fire") return 1.5;
  if ((att === "Light" && def === "Shadow") || (att === "Shadow" && def === "Light")) return 1.5;
  // reverse matchups
  if (att === "Nature" && def === "Fire") return 0.7;
  if (att === "Water" && def === "Nature") return 0.7;
  if (att === "Fire" && def === "Water") return 0.7;
  return 1;
}

export const ELEMENT_GLYPH: Record<Element, string> = {
  Fire: "🔥",
  Water: "💧",
  Nature: "🌿",
  Light: "✨",
  Shadow: "🌙",
};

export const ELEMENT_TONE: Record<Element, string> = {
  Fire: "bg-warning text-ink",
  Water: "bg-arcade text-background",
  Nature: "bg-success text-ink",
  Light: "bg-secondary text-ink",
  Shadow: "bg-ink text-background",
};

export const RARITY_TONE: Record<Rarity, string> = {
  Common: "bg-muted text-ink",
  Uncommon: "bg-success/30 text-ink",
  Rare: "bg-arcade text-background",
  Epic: "bg-primary text-primary-foreground",
  Legendary: "bg-warning text-ink",
  Mythic: "bg-ink text-background",
};

/** Probability table for each egg tier. Sums to 100 per row. */
export const EGG_ODDS: Record<EggTier, { rarity: Rarity; pct: number }[]> = {
  common: [
    { rarity: "Common", pct: 70 },
    { rarity: "Uncommon", pct: 22 },
    { rarity: "Rare", pct: 7 },
    { rarity: "Epic", pct: 1 },
  ],
  rare: [
    { rarity: "Common", pct: 35 },
    { rarity: "Uncommon", pct: 35 },
    { rarity: "Rare", pct: 22 },
    { rarity: "Epic", pct: 7 },
    { rarity: "Legendary", pct: 1 },
  ],
  epic: [
    { rarity: "Uncommon", pct: 30 },
    { rarity: "Rare", pct: 40 },
    { rarity: "Epic", pct: 22 },
    { rarity: "Legendary", pct: 7 },
    { rarity: "Mythic", pct: 1 },
  ],
  legendary: [
    { rarity: "Rare", pct: 25 },
    { rarity: "Epic", pct: 45 },
    { rarity: "Legendary", pct: 25 },
    { rarity: "Mythic", pct: 5 },
  ],
  mythic: [
    { rarity: "Epic", pct: 30 },
    { rarity: "Legendary", pct: 55 },
    { rarity: "Mythic", pct: 15 },
  ],
};

export type EggTier = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface EggDef {
  tier: EggTier;
  label: string;
  priceMatic: number;
  bg: string; // tailwind bg
  ring: string;
  glow: string;
  description: string;
}

export const EGGS: EggDef[] = [
  { tier: "common", label: "Common Egg", priceMatic: 0.02, bg: "bg-success", ring: "ring-success", glow: "shadow-[0_0_30px_oklch(0.7_0.17_162_/_0.6)]", description: "Standard hatch. Friendly starter pets." },
  { tier: "rare", label: "Rare Egg", priceMatic: 0.08, bg: "bg-arcade", ring: "ring-arcade", glow: "shadow-[0_0_40px_oklch(0.62_0.2_256_/_0.7)]", description: "Elemental specialists with charged auras." },
  { tier: "epic", label: "Epic Egg", priceMatic: 0.25, bg: "bg-primary", ring: "ring-primary", glow: "shadow-[0_0_50px_oklch(0.66_0.22_293_/_0.7)]", description: "Armored beasts. High signature damage." },
  { tier: "legendary", label: "Legendary Egg", priceMatic: 0.9, bg: "bg-warning", ring: "ring-warning", glow: "shadow-[0_0_60px_oklch(0.78_0.16_75_/_0.85)]", description: "Apex guardians. Cinematic ultimates." },
  { tier: "mythic", label: "Mythic Egg", priceMatic: 4.2, bg: "bg-ink", ring: "ring-ink", glow: "shadow-[0_0_80px_oklch(0.66_0.22_293_/_0.9)]", description: "Cosmic anomaly. 2/100 worldwide drop." },
];

/* ------------------------- ROSTER ------------------------- */

export const ROSTER: Species[] = [
  // Common (6)
  {
    id: "flame-fox", name: "Flame Fox", rarity: "Common", element: "Fire", sprite: flameFox,
    lore: "Born in cinder dens, this kit treats every spark like a tail-chase.",
    base: { str: 11, agi: 13, int: 9, hp: 92 },
    signature: { id: "ember-tail", name: "Ember Tail", kind: "basic", power: 14, energyCost: 0, unlockStage: 1, description: "Quick fiery swipe. No cost." },
  },
  {
    id: "aqua-slime", name: "Aqua Slime", rarity: "Common", element: "Water", sprite: aquaSlime,
    lore: "85% jelly, 15% hugs. Bounces back from anything.",
    base: { str: 8, agi: 9, int: 12, hp: 110 },
    signature: { id: "splash-rebound", name: "Splash Rebound", kind: "basic", power: 12, energyCost: 0, unlockStage: 1, description: "Bouncy splash that restores 4 HP." },
  },
  {
    id: "leaf-drake", name: "Leaf Drake", rarity: "Common", element: "Nature", sprite: leafDrake,
    lore: "A pocket dragon raised in a chaplain's herb garden.",
    base: { str: 12, agi: 11, int: 10, hp: 96 },
    signature: { id: "vine-bite", name: "Vine Bite", kind: "basic", power: 15, energyCost: 0, unlockStage: 1, description: "Bite that tangles roots around the foe." },
  },
  {
    id: "snow-kitten", name: "Snow Kitten", rarity: "Common", element: "Water", sprite: snowKitten,
    lore: "Found in heated shoeboxes during blizzards. Refuses to leave.",
    base: { str: 9, agi: 14, int: 10, hp: 88 },
    signature: { id: "frost-paw", name: "Frost Paw", kind: "basic", power: 13, energyCost: 0, unlockStage: 1, description: "Cold swipe with a chance to freeze." },
  },
  {
    id: "volt-bun", name: "Volt Bun", rarity: "Common", element: "Light", sprite: voltBun,
    lore: "Static-charged ears double as a rabbit-ear antenna.",
    base: { str: 10, agi: 15, int: 11, hp: 86 },
    signature: { id: "static-hop", name: "Static Hop", kind: "basic", power: 14, energyCost: 0, unlockStage: 1, description: "Lightning-fast hop strike." },
  },
  {
    id: "star-sprout", name: "Star Sprout", rarity: "Common", element: "Nature", sprite: starSprout,
    lore: "Photosynthesizes starlight. Whispers prophecies at dawn.",
    base: { str: 8, agi: 10, int: 14, hp: 94 },
    signature: { id: "stellar-pollen", name: "Stellar Pollen", kind: "basic", power: 12, energyCost: 0, unlockStage: 1, description: "Releases glowing spores." },
  },

  // Rare (5)
  {
    id: "crystal-bun", name: "Crystal Bun", rarity: "Rare", element: "Light", sprite: crystalBun,
    lore: "Iridescent fur refracts every prophecy ever spoken about it.",
    base: { str: 14, agi: 18, int: 16, hp: 124 },
    signature: { id: "diamond-barrage", name: "Diamond Barrage", kind: "skill", power: 26, energyCost: 3, unlockStage: 2, description: "Volley of refracted shards." },
  },
  {
    id: "shadow-pup", name: "Shadow Pup", rarity: "Rare", element: "Shadow", sprite: shadowPup,
    lore: "Steps between rooms by walking through their shadows.",
    base: { str: 17, agi: 19, int: 14, hp: 122 },
    signature: { id: "umbra-fang", name: "Umbra Fang", kind: "skill", power: 28, energyCost: 3, unlockStage: 2, description: "Fang strike from the foe's blind spot." },
  },
  {
    id: "frost-owl", name: "Frost Owl", rarity: "Rare", element: "Water", sprite: frostOwl,
    lore: "Drops temperature by 12°C just by entering the room.",
    base: { str: 13, agi: 17, int: 19, hp: 118 },
    signature: { id: "blizzard-shriek", name: "Blizzard Shriek", kind: "skill", power: 24, energyCost: 3, status: "freeze", unlockStage: 2, description: "Sonic chill — chance to freeze." },
  },
  {
    id: "lava-sal", name: "Lava Newt", rarity: "Rare", element: "Fire", sprite: lavaSal,
    lore: "Sleeps in pizza ovens and considers it slumber etiquette.",
    base: { str: 18, agi: 14, int: 14, hp: 130 },
    signature: { id: "magma-tail", name: "Magma Tail", kind: "skill", power: 30, energyCost: 3, status: "burn", unlockStage: 2, description: "Tail whip leaves a burn." },
  },
  {
    id: "moon-cat", name: "Moon Cat", rarity: "Rare", element: "Shadow", sprite: moonCat,
    lore: "Disappears every full moon. Returns smelling of stardust.",
    base: { str: 14, agi: 18, int: 18, hp: 116 },
    signature: { id: "lunar-pulse", name: "Lunar Pulse", kind: "skill", power: 25, energyCost: 3, unlockStage: 2, description: "Pulse of moonlight, ignores 20% defense." },
  },

  // Epic (5)
  {
    id: "iron-drake", name: "Iron Drake", rarity: "Epic", element: "Fire", sprite: ironDrake,
    lore: "Plate scales forged in the Anvil Caves. Roars in binary.",
    base: { str: 24, agi: 16, int: 18, hp: 178 },
    signature: { id: "forge-breath", name: "Forge Breath", kind: "skill", power: 38, energyCost: 4, status: "burn", unlockStage: 2, description: "Molten exhale — sustained burn." },
  },
  {
    id: "cyber-panther", name: "Cyber Panther", rarity: "Epic", element: "Light", sprite: cyberPanther,
    lore: "Augmented stride at 90 km/h. Dreams in shaders.",
    base: { str: 22, agi: 26, int: 20, hp: 168 },
    signature: { id: "neon-rake", name: "Neon Rake", kind: "skill", power: 36, energyCost: 4, status: "shock", unlockStage: 2, description: "Plasma claw rake — chance to shock." },
  },
  {
    id: "phoenix", name: "Sun Phoenix", rarity: "Epic", element: "Fire", sprite: phoenix,
    lore: "Each death is a costume change. Insurance refuses to cover it.",
    base: { str: 20, agi: 24, int: 24, hp: 172 },
    signature: { id: "rebirth-flare", name: "Rebirth Flare", kind: "skill", power: 34, energyCost: 4, unlockStage: 2, description: "Flare burst that heals 12 HP on use." },
  },
  {
    id: "plasma-wolf", name: "Plasma Wolf", rarity: "Epic", element: "Shadow", sprite: petPurple,
    lore: "Howl warps lightning. Pack of one — by choice.",
    base: { str: 26, agi: 22, int: 18, hp: 174 },
    signature: { id: "violet-fang", name: "Violet Fang", kind: "skill", power: 40, energyCost: 4, status: "shock", unlockStage: 2, description: "Charged fang — paralyzes briefly." },
  },
  {
    id: "titan-bun", name: "Titan Bun", rarity: "Epic", element: "Nature", sprite: aquaSlime, // soft fallback duplicate (visually distinct via tinted aura)
    lore: "Two-meter rabbit, three-ton stomp, four ear flops per second.",
    base: { str: 28, agi: 14, int: 16, hp: 196 },
    signature: { id: "thunder-stomp", name: "Thunder Stomp", kind: "skill", power: 42, energyCost: 4, unlockStage: 2, description: "Ground-shaking stomp." },
  },

  // Legendary (3)
  {
    id: "divine-lion", name: "Divine Lion", rarity: "Legendary", element: "Light", sprite: divineLion,
    lore: "Mane catches sunrise hours before the sun does.",
    base: { str: 32, agi: 24, int: 28, hp: 230 },
    signature: { id: "halo-roar", name: "Halo Roar", kind: "ultimate", power: 70, energyCost: 6, unlockStage: 3, description: "Screen-shaking roar of dawn." },
  },
  {
    id: "eclipse-serpent", name: "Eclipse Serpent", rarity: "Legendary", element: "Shadow", sprite: eclipseSerpent,
    lore: "Coils around suns and moons alike. Neutral by nature.",
    base: { str: 30, agi: 28, int: 26, hp: 220 },
    signature: { id: "twin-eclipse", name: "Twin Eclipse", kind: "ultimate", power: 66, energyCost: 6, status: "freeze", unlockStage: 3, description: "Sun-and-moon strike. Chance to freeze." },
  },
  {
    id: "star-dragon", name: "Star Dragon", rarity: "Legendary", element: "Water", sprite: starDragon,
    lore: "Each scale is a galaxy on cool-down.",
    base: { str: 28, agi: 26, int: 32, hp: 224 },
    signature: { id: "galaxy-breath", name: "Galaxy Breath", kind: "ultimate", power: 68, energyCost: 6, unlockStage: 3, description: "Cosmic exhale, ignores 35% defense." },
  },

  // Mythic (2)
  {
    id: "origin-tam", name: "Origin Tam", rarity: "Mythic", element: "Light", sprite: originTam,
    lore: "The first Tam. Predates the chain. Predates the egg.",
    base: { str: 36, agi: 34, int: 36, hp: 280 },
    signature: { id: "genesis-aria", name: "Genesis Aria", kind: "ultimate", power: 90, energyCost: 6, unlockStage: 3, description: "Reality re-renders for one frame." },
  },
  {
    id: "void-emperor", name: "Void Emperor", rarity: "Mythic", element: "Shadow", sprite: voidEmperor,
    lore: "Wears a crown of unmade stars. Bows to no client.",
    base: { str: 40, agi: 30, int: 38, hp: 290 },
    signature: { id: "abyssal-crown", name: "Abyssal Crown", kind: "ultimate", power: 92, energyCost: 6, status: "shock", unlockStage: 3, description: "Singularity strike. Chains shock." },
  },
];

export const RARITY_MULT: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.12,
  Rare: 1.28,
  Epic: 1.5,
  Legendary: 1.8,
  Mythic: 2.2,
};

export function pickSpeciesByRarity(rarity: Rarity): Species {
  const pool = ROSTER.filter((s) => s.rarity === rarity);
  if (pool.length === 0) {
    // Uncommon has no curated species — promote a Common with a tinted aura at runtime.
    const fallback = ROSTER.filter((s) => s.rarity === "Common");
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rollRarityFromEgg(tier: EggTier, luckBoost = 0): Rarity {
  const odds = EGG_ODDS[tier];
  const r = Math.random() * 100 - luckBoost;
  let acc = 0;
  for (const o of odds) {
    acc += o.pct;
    if (r <= acc) return o.rarity;
  }
  return odds[odds.length - 1].rarity;
}

export function getSpecies(id: string): Species | undefined {
  return ROSTER.find((s) => s.id === id);
}
