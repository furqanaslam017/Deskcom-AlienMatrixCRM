import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — Sage design system.
 * Variants: default (accent soft), neutral, success, warning, error, info.
 * Compat aliases: secondary -> neutral, destructive -> error, outline -> neutral.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full border px-3 py-0.5",
    "text-xs font-medium leading-5",
    "transition-colors duration-fast ease-out",
    "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-[var(--line)] bg-[var(--glass-2)] text-[var(--text)]",
        neutral:
          "border-[var(--line)] bg-[var(--glass-2)] text-[var(--muted)]",
        success:
          "border-transparent bg-[var(--pine)] text-[var(--on-pine)]",
        warning:
          "border-transparent bg-[var(--butter)] text-[var(--on-butter)]",
        error:
          "border-transparent bg-[var(--tomato)] text-[var(--on-tomato)]",
        info:
          "border-transparent bg-[var(--pine)]/20 text-[var(--pine)]",
        // shadcn aliases
        secondary:
          "border-[var(--line)] bg-[var(--glass-2)] text-[var(--muted)]",
        destructive:
          "border-transparent bg-[var(--tomato)] text-[var(--on-tomato)]",
        outline:
          "border-[var(--line-2)] bg-transparent text-[var(--text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
