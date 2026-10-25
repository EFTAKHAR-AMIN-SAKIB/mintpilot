import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "subtle" | "floating";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "surface", children, ...props }, ref) => {
    const baseStyles =
      "rounded-[24px] border transition-all duration-200 overflow-hidden";

    const variantStyles = {
      surface:
        "seer-glass border-[var(--border)] shadow-xl",
      subtle:
        "bg-[var(--capsule)] border-[var(--border)]",
      floating:
        "seer-glass border-[var(--border)] shadow-2xl",
    };

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
