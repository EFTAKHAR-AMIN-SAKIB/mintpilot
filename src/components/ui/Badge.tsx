import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "dev" | "blue";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full select-none";

  const variantStyles = {
    neutral:
      "bg-[var(--capsule)] text-[var(--muted)] border border-[var(--border)]",
    success:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    danger:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30",
    dev:
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",
    blue:
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
};
