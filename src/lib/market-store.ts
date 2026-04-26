// Marketplace listings. Seeded with a few NPC listings on first load.
import { loadPets, savePet, type Pet, type Rarity } from "./pets-store";
import petPurple from "@/assets/pet-purple.png";
import petPink from "@/assets/pet-pink.png";
import petLegendary from "@/assets/pet-legendary.png";

export interface Listing {
  id: string;
  pet: Pet;
  priceMatic: number;
  seller: string; // address
  listedAt: number;
}

const KEY = "tam.market.v1";

function tx() {
  return "0x" + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function seed(): Listing[] {
  const seeds: Array<{ name: string; species: string; element: string; rarity: Rarity; sprite: string; stats: Pet["stats"]; price: number; seller: string }> = [
    { name: "Glacier-WHL", species: "Rexor", element: "Cyber", rarity: "Legendary", sprite: petLegendary, stats: { str: 28, agi: 22, int: 26, hp: 220 }, price: 0.42, seller: "0x9F2e…1d8C" },
    { name: "Sun-MOC", species: "Mira", element: "Spark", rarity: "Epic", sprite: petPink, stats: { str: 18, agi: 24, int: 21, hp: 176 }, price: 0.18, seller: "0x4A7c…83e1" },
    { name: "Voidling-PRM", species: "Vyrn", element: "Void", rarity: "Rare", sprite: petPurple, stats: { str: 16, agi: 20, int: 22, hp: 148 }, price: 0.27, seller: "0x1aB2…2D3E" },
    { name: "Hatchling-481", species: "Vyrn", element: "Void", rarity: "Common", sprite: petPurple, stats: { str: 9, agi: 11, int: 10, hp: 92 }, price: 0.04, seller: "0x4A7c…83e1" },
    { name: "Mira-LX", species: "Mira", element: "Spark", rarity: "Uncommon", sprite: petPink, stats: { str: 12, agi: 14, int: 13, hp: 110 }, price: 0.08, seller: "0x9F2e…1d8C" },
    { name: "Rexor-NX", species: "Rexor", element: "Cyber", rarity: "Epic", sprite: petLegendary, stats: { str: 22, agi: 18, int: 20, hp: 184 }, price: 0.31, seller: "0x1aB2…2D3E" },
  ];
  return seeds.map((s, i) => ({
    id: `lst_seed_${i}`,
    listedAt: Date.now() - (i + 1) * 3600_000,
    priceMatic: s.price,
    seller: s.seller,
    pet: {
      id: `npc_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name: s.name,
      species: s.species,
      sprite: s.sprite,
      rarity: s.rarity,
      element: s.element,
      stats: s.stats,
      hatchedAt: Date.now() - (i + 1) * 86400_000,
      txHash: tx() + "…",
    },
  }));
}

export function loadListings(): Listing[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as Listing[];
  } catch {
    return [];
  }
}

function saveAll(l: Listing[]) {
  localStorage.setItem(KEY, JSON.stringify(l));
}

export function createListing(pet: Pet, priceMatic: number, seller: string): Listing {
  const all = loadListings();
  const lst: Listing = {
    id: `lst_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    pet,
    priceMatic,
    seller,
    listedAt: Date.now(),
  };
  all.unshift(lst);
  saveAll(all);
  return lst;
}

export function cancelListing(id: string) {
  const all = loadListings().filter((l) => l.id !== id);
  saveAll(all);
}

/** Buys a listing, transferring the pet to the buyer's pet collection. */
export function buyListing(id: string): { listing: Listing; txHash: string } | null {
  const all = loadListings();
  const idx = all.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const [lst] = all.splice(idx, 1);
  saveAll(all);
  // Add the pet to the buyer's local collection (idempotent on id).
  const owned = loadPets();
  if (!owned.some((p) => p.id === lst.pet.id)) {
    savePet(lst.pet);
  }
  return {
    listing: lst,
    txHash: "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
  };
}
