import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  tone = "ink",
  className,
}: {
  children: ReactNode;
  tone?: "ink" | "primary" | "success" | "warning" | "arcade";
  className?: string;
}) {
  const tones = {
    ink: "bg-card text-ink border-ink",
    primary: "bg-primary/10 text-primary border-primary",
    success: "bg-success/15 text-ink border-success",
    warning: "bg-warning/20 text-ink border-ink",
    arcade: "bg-arcade/10 text-arcade border-arcade",
  } as const;
  return (
    <span
      className={cn(
        "font-mono-ui inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1 text-[11px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
