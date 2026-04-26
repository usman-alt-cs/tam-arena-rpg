import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "ink";
type Size = "md" | "lg" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground border-ink",
  secondary: "bg-secondary text-ink border-ink",
  ghost: "bg-card text-ink border-ink",
  ink: "bg-ink text-background border-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export const TactileButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-mono-ui inline-flex items-center justify-center gap-2 rounded-xl border-2",
          "shadow-[0_6px_0_var(--ink)] hover:shadow-[0_3px_0_var(--ink)] active:shadow-[0_1px_0_var(--ink)]",
          "translate-y-0 hover:translate-y-[3px] active:translate-y-[5px]",
          "transition-all duration-100 ease-out select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
TactileButton.displayName = "TactileButton";
