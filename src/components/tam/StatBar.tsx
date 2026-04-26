import { cn } from "@/lib/utils";

export function StatBar({
  label,
  value,
  max = 100,
  tone = "success",
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "success" | "warning" | "primary" | "arcade";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const fill = {
    success: "bg-success",
    warning: "bg-warning",
    primary: "bg-primary",
    arcade: "bg-arcade",
  }[tone];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono-ui text-[10px] text-muted-foreground">{label}</span>
        <span className="font-mono-ui text-[11px] tabular-nums text-ink">
          {value}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="relative h-3 rounded-sm border-2 border-ink bg-card overflow-hidden">
        <div className={cn("h-full transition-[width] duration-500", fill)} style={{ width: `${pct}%` }} />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 6px)",
          }}
        />
      </div>
    </div>
  );
}
