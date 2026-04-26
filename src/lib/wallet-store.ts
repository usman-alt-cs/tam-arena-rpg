// Mock wallet — no web3 libs. Stores a chosen "address" in localStorage.
const KEY = "tam.wallet.v1";

export interface Wallet {
  address: string;
  label: string;
  connectedAt: number;
}

export const DEMO_ACCOUNTS: { address: string; label: string; balance: string }[] = [
  { address: "0x4A7c1bD9e6E2af3128f53d901a4d9b81fA7c83e1", label: "Trainer alpha", balance: "12.84 MATIC" },
  { address: "0x9F2eC8B0e3A1d8C5f7B6a4E9D2cF1a8B0e3A1d8C", label: "Whale wallet", balance: "1,402.10 MATIC" },
  { address: "0x1aB2c3D4e5F60718293a4b5c6d7e8f9A0B1c2D3E", label: "Burner #003", balance: "0.42 MATIC" },
];

let cache: Wallet | null | undefined;
const listeners = new Set<() => void>();

export function getWallet(): Wallet | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Wallet) : null;
  } catch {
    cache = null;
  }
  return cache;
}

export function connectWallet(address: string, label: string): Wallet {
  const w: Wallet = { address, label, connectedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(w));
  cache = w;
  listeners.forEach((l) => l());
  return w;
}

export function disconnectWallet() {
  localStorage.removeItem(KEY);
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeWallet(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
