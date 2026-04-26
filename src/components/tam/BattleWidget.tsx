import { useEffect, useState } from "react";
import petPurple from "@/assets/pet-purple.png";
import petLegendary from "@/assets/pet-legendary.png";
import { TactileButton } from "./TactileButton";
import { Chip } from "./Chip";
import { StatBar } from "./StatBar";
import { cn } from "@/lib/utils";

type Move = "rock" | "paper" | "scissors";

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
  const [playerHp, setPlayerHp] = useState(100);
  const [foeHp, setFoeHp] = useState(100);
  const [lastMove, setLastMove] = useState<{ p: Move; o: Move; result: string } | null>(null);
  const [shakeFoe, setShakeFoe] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [damage, setDamage] = useState<{ to: "p" | "o"; amt: number; id: number } | null>(null);

  useEffect(() => {
    if (playerHp <= 0 || foeHp <= 0) {
      const t = setTimeout(() => {
        setPlayerHp(100);
        setFoeHp(100);
        setLastMove(null);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [playerHp, foeHp]);

  function play(move: Move) {
    const moves: Move[] = ["rock", "paper", "scissors"];
    const o = moves[Math.floor(Math.random() * 3)];
    const r = resolve(move, o);
    const dmg = 18 + Math.floor(Math.random() * 18);
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
    setLastMove({ p: move, o, result: r });
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
          <span className="font-mono-ui text-[11px]">Live arena · Match #4471</span>
        </div>
        <Chip tone="arcade">Polygon · 0.0001 USD/action</Chip>
      </div>

      {/* Battle scene */}
      <div className="relative mt-4 grid grid-cols-2 gap-3 rounded-xl border-2 border-ink bg-background p-4 grid-bg overflow-hidden">
        {/* scanline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-12 opacity-20 mix-blend-multiply"
          style={{
            background: "linear-gradient(transparent, var(--arcade), transparent)",
            animation: "scan 3.5s linear infinite",
          }}
        />

        <PetSlot
          name="Cyber-Rex"
          level={36}
          hp={playerHp}
          src={petLegendary}
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

      {/* Result line */}
      <div className="mt-3 h-7 flex items-center justify-center font-mono-ui text-[11px]">
        {!lastMove && <span className="text-muted-foreground">Pick a move to engage →</span>}
        {lastMove && playerHp > 0 && foeHp > 0 && (
          <span>
            You played <b>{lastMove.p}</b> · Foe played <b>{lastMove.o}</b> ·{" "}
            <span
              className={cn(
                lastMove.result === "win" && "text-success",
                lastMove.result === "lose" && "text-destructive",
                lastMove.result === "draw" && "text-muted-foreground",
              )}
            >
              {lastMove.result.toUpperCase()}
            </span>
          </span>
        )}
        {(playerHp <= 0 || foeHp <= 0) && (
          <span className="text-primary">
            {foeHp <= 0 ? "VICTORY · +120 XP minted" : "K.O. · Resetting bracket…"}
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
            disabled={playerHp <= 0 || foeHp <= 0}
            className="flex-col !h-auto py-3"
          >
            <span className="text-2xl leading-none">{m.glyph}</span>
            <span className="text-[11px]">{m.label}</span>
          </TactileButton>
        ))}
      </div>
    </div>
  );
}

function PetSlot({
  name,
  level,
  hp,
  src,
  shake,
  dmg,
  align,
  flip,
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
        <span className="font-display font-semibold text-sm">{name}</span>
        <Chip tone="ink" className="!py-0.5">
          Lv {level}
        </Chip>
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
