import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "subtle" | "floating";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "surface", children, ...props }, ref) => {
    const baseStyles =
      "rounded-apple border transition-all duration-200 overflow-hidden";

    const variantStyles = {
      surface:
        "bg-apple-surface border-apple-border shadow-apple dark:bg-apple-darkSurface dark:border-apple-darkBorder dark:shadow-apple-dark",
      subtle:
        "bg-apple-subtle border-transparent dark:bg-apple-darkSubtle",
      floating:
        "bg-apple-surface/90 backdrop-blur-xl border-apple-border shadow-apple-floating dark:bg-apple-darkSurface/90 dark:border-apple-darkBorder",
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
