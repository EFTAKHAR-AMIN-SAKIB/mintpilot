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
      "bg-black/5 text-apple-secondary dark:bg-white/10 dark:text-apple-darkSecondary",
    success:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
    warning:
      "bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
    danger:
      "bg-red-50 text-red-700 border border-red-200/50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40",
    dev:
      "bg-purple-50 text-purple-700 border border-purple-200/50 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40",
    blue:
      "bg-blue-50 text-apple-blue border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
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
