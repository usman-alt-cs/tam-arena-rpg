import { useEffect, useMemo, useState } from "react";
import petPurple from "@/assets/pet-purple.png";
import petLegendary from "@/assets/pet-legendary.png";
import { TactileButton } from "./TactileButton";
import { Chip } from "./Chip";
import { StatBar } from "./StatBar";
import { cn } from "@/lib/utils";
import { recordRound, loadBattles, type BattleRecord, type Move } from "@/lib/battles-store";
import { useRequireWallet, useWallet } from "@/hooks/use-wallet";
import { firstOwnedPet, recordBattle } from "@/lib/care-store";
import { shortAddr } from "@/lib/wallet-store";

const MOVES: { id: Move; label: string; glyph: string }[] = [
  { id: "rock", label: "Rock", glyph: "✊" },
  { id: "paper", label: "Paper", glyph: "✋" },
  { id: "scissors", label: "Scissors", glyph: "✌" },
];

function resolve(p: Move, o: Move): "win" | "lose" | "draw" {
  if (p === o) return "draw";
  if (
    (p === "rock" && o === "scissors") ||
    (p === "paper" && o === "rock") ||
    (p === "scissors" && o === "paper")
  )
    return "win";
  return "lose";
}

export function BattleWidget() {
  const wallet = useWallet();
  const requireWallet = useRequireWallet();
  const [playerHp, setPlayerHp] = useState(100);
  const [foeHp, setFoeHp] = useState(100);
  const [shakeFoe, setShakeFoe] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [damage, setDamage] = useState<{ to: "p" | "o"; amt: number; id: number } | null>(null);
  const [lastRecord, setLastRecord] = useState<BattleRecord | null>(null);
  const [history, setHistory] = useState<BattleRecord[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setHistory(loadBattles().slice(0, 4));
  }, []);

  useEffect(() => {
    if (playerHp <= 0 || foeHp <= 0) {
      const t = setTimeout(() => {
        setPlayerHp(100);
        setFoeHp(100);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [playerHp, foeHp]);

  const playerPet = useMemo(() => (typeof window !== "undefined" ? firstOwnedPet() : null), [lastRecord, wallet]);
  const playerName = playerPet?.name ?? "Cyber-Rex";
  const playerSprite = playerPet?.sprite ?? petLegendary;
  const playerLevel = playerPet ? Math.max(1, Math.floor((playerPet.stats.str + playerPet.stats.agi + playerPet.stats.int) / 3)) : 36;

  function play(move: Move) {
    if (pending) return;
    const proceed = requireWallet({
      action: "battle",
      redirect: "/",
      run: () => doPlay(move),
    });
    if (!proceed) return;
  }

  function doPlay(move: Move) {
    const moves: Move[] = ["rock", "paper", "scissors"];
    const o = moves[Math.floor(Math.random() * 3)];
    const r = resolve(move, o);
    const dmg = 18 + Math.floor(Math.random() * 18);

    setPending(true);
    if (r === "win") {
      setFoeHp((h) => Math.max(0, h - dmg));
      setShakeFoe(true);
      setDamage({ to: "o", amt: dmg, id: Date.now() });
      setTimeout(() => setShakeFoe(false), 350);
    } else if (r === "lose") {
      setPlayerHp((h) => Math.max(0, h - dmg));
      setShakePlayer(true);
      setDamage({ to: "p", amt: dmg, id: Date.now() });
      setTimeout(() => setShakePlayer(false), 350);
    }

    // Record on-chain (mock).
    const opponentName = "Voidling";
    const rec = recordRound({
      petId: playerPet?.id,
      opponentName,
      playerMove: move,
      opponentMove: o,
      result: r,
      damage: r === "draw" ? 0 : dmg,
    });
    setLastRecord(rec);
    setHistory((h) => [rec, ...h].slice(0, 4));

    if (playerPet) {
      recordBattle(playerPet.id, opponentName, r, `${move} vs ${o}${r !== "draw" ? ` · -${dmg} HP` : ""}`);
    }

    setTimeout(() => setPending(false), 450);
  }

  return (
    <div className="relative rounded-2xl border-2 border-ink bg-card p-5 shadow-[6px_6px_0_var(--ink)]">
      {/* Header / telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative inline-block h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-success animate-ping" />
            <span className="absolute inset-0 rounded-full bg-success" />
          </span>
          <span className="font-mono-ui text-[11px]">
            Live arena · Match #{(lastRecord?.matchId ?? 4471).toString()}
          </span>
        </div>
        <Chip tone="arcade">
          {wallet ? `connected · ${shortAddr(wallet.address)}` : "Polygon · 0.0001 USD/action"}
        </Chip>
      </div>

      {/* Battle scene */}
      <div className="relative mt-4 grid grid-cols-2 gap-3 rounded-xl border-2 border-ink bg-background p-4 grid-bg overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-12 opacity-20 mix-blend-multiply"
          style={{
            background: "linear-gradient(transparent, var(--arcade), transparent)",
            animation: "scan 3.5s linear infinite",
          }}
        />
        <PetSlot
          name={playerName}
          level={playerLevel}
          hp={playerHp}
          src={playerSprite}
          shake={shakePlayer}
          dmg={damage?.to === "p" ? damage : null}
          align="left"
        />
        <PetSlot
          name="Voidling"
          level={34}
          hp={foeHp}
          src={petPurple}
          shake={shakeFoe}
          dmg={damage?.to === "o" ? damage : null}
          align="right"
          flip
        />
      </div>

      {/* Result line / on-chain receipt */}
      <div className="mt-3 min-h-[28px] flex items-center justify-center font-mono-ui text-[11px] text-center">
        {!lastRecord && <span className="text-muted-foreground">Pick a move to engage →</span>}
        {lastRecord && playerHp > 0 && foeHp > 0 && (
          <span>
            <b>{lastRecord.playerMove}</b> vs <b>{lastRecord.opponentMove}</b> ·{" "}
            <span
              className={cn(
                lastRecord.result === "win" && "text-success",
                lastRecord.result === "lose" && "text-destructive",
                lastRecord.result === "draw" && "text-muted-foreground",
              )}
            >
              {lastRecord.result.toUpperCase()}
            </span>{" "}
            · block #{lastRecord.block.toLocaleString()}
          </span>
        )}
        {(playerHp <= 0 || foeHp <= 0) && (
          <span className="text-primary">
            {foeHp <= 0 ? "VICTORY · +35 XP minted" : "K.O. · Resetting bracket…"}
          </span>
        )}
      </div>

      {/* Move buttons */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {MOVES.map((m) => (
          <TactileButton
            key={m.id}
            variant="ghost"
            size="md"
            onClick={() => play(m.id)}
            disabled={playerHp <= 0 || foeHp <= 0 || pending}
            className="flex-col !h-auto py-3"
          >
            <span className="text-2xl leading-none">{m.glyph}</span>
            <span className="text-[11px]">{m.label}</span>
          </TactileButton>
        ))}
      </div>

      {/* On-chain receipt */}
      {lastRecord && (
        <div className="mt-4 rounded-xl border-2 border-ink bg-ink text-background px-4 py-3 font-mono-ui text-[10px] space-y-1">
          <div className="flex items-center justify-between opacity-70 uppercase">
            <span>match receipt</span>
            <span className="text-success">● confirmed</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <Cell k="tx" v={lastRecord.txHash.slice(0, 14) + "…"} />
            <Cell k="block" v={`#${lastRecord.block.toLocaleString()}`} />
            <Cell k="result" v={lastRecord.result.toUpperCase()} />
            <Cell k="gas" v={`$${lastRecord.gasUsd.toFixed(5)}`} />
          </div>
        </div>
      )}

      {/* Recent history */}
      {history.length > 0 && (
        <div className="mt-3">
          <div className="font-mono-ui text-[10px] uppercase text-muted-foreground mb-1.5">
            recent rounds
          </div>
          <ul className="grid grid-cols-4 gap-1.5">
            {history.slice(0, 4).map((h) => (
              <li
                key={h.id}
                className={`rounded-md border-2 border-ink px-2 py-1.5 text-center font-mono-ui text-[10px] ${
                  h.result === "win" ? "bg-success/15" : h.result === "lose" ? "bg-destructive/10" : "bg-muted"
                }`}
                title={`${h.playerMove} vs ${h.opponentMove}`}
              >
                <div className="uppercase">{h.result}</div>
                <div className="opacity-60 tabular-nums">#{h.matchId}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="opacity-50 uppercase text-[9px]">{k}</div>
      <div className="tabular-nums">{v}</div>
    </div>
  );
}

function PetSlot({
  name, level, hp, src, shake, dmg, align, flip,
}: {
  name: string;
  level: number;
  hp: number;
  src: string;
  shake: boolean;
  dmg: { amt: number; id: number } | null;
  align: "left" | "right";
  flip?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-2", align === "right" && "items-end text-right")}>
      <div className="flex w-full items-center justify-between gap-2">
        <span className="font-display font-semibold text-sm truncate">{name}</span>
        <Chip tone="ink" className="!py-0.5">Lv {level}</Chip>
      </div>
      <StatBar label="HP" value={hp} tone={hp > 50 ? "success" : hp > 25 ? "warning" : "primary"} />
      <div className={cn("relative w-full h-32 sm:h-36 flex items-end justify-center")}>
        {dmg && (
          <span
            key={dmg.id}
            className="absolute top-0 font-display text-xl text-destructive font-bold pointer-events-none"
            style={{ animation: "pet-bounce 0.7s ease-out forwards" }}
          >
            -{dmg.amt}
          </span>
        )}
        <img
          src={src}
          alt={name}
          width={140}
          height={140}
          className={cn(
            "h-28 sm:h-32 w-auto pixelated pixel-shadow",
            !shake && "animate-[pet-idle_2.4s_ease-in-out_infinite]",
            shake && "animate-[pet-bounce_0.35s_ease-out]",
            flip && "scale-x-[-1]",
          )}
        />
      </div>
    </div>
  );
}
