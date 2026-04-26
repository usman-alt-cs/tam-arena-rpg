// On-chain battle log (mock). Records every RPS round on the landing page.
export type Move = "rock" | "paper" | "scissors";
export type Result = "win" | "lose" | "draw";

export interface BattleRecord {
  id: string;
  matchId: number;
  at: number;
  petId?: string;
  opponentName: string;
  playerMove: Move;
  opponentMove: Move;
  result: Result;
  damage: number;
  txHash: string;
  block: number;
  gasUsd: number;
}

const KEY = "tam.battles.v1";

export function loadBattles(): BattleRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function save(all: BattleRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
}

export function recordRound(input: Omit<BattleRecord, "id" | "at" | "txHash" | "block" | "gasUsd" | "matchId">): BattleRecord {
  const all = loadBattles();
  const matchId = 4471 + all.length + 1;
  const rec: BattleRecord = {
    ...input,
    id: `b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    matchId,
    at: Date.now(),
    txHash:
      "0x" +
      Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    block: 58_400_000 + Math.floor(Math.random() * 99999),
    gasUsd: +(0.00009 + Math.random() * 0.00012).toFixed(5),
  };
  all.unshift(rec);
  save(all);
  return rec;
}
