import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/50 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-apple-blue text-white hover:bg-apple-blueHover shadow-sm dark:bg-[#0071e3] dark:hover:bg-[#0077ed]",
      secondary:
        "bg-[#e8e8ed] text-apple-text hover:bg-[#dedee3] dark:bg-apple-darkSubtle dark:text-apple-darkText dark:hover:bg-[#3a3a3c]",
      outline:
        "border border-apple-border text-apple-text hover:bg-apple-subtle dark:border-apple-darkBorder dark:text-apple-darkText dark:hover:bg-apple-darkSubtle",
      ghost:
        "text-apple-text hover:bg-black/5 dark:text-apple-darkText dark:hover:bg-white/10",
      danger:
        "bg-apple-red text-white hover:bg-red-600 shadow-sm",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-full gap-1.5",
      md: "h-10 px-4 text-sm rounded-full gap-2",
      lg: "h-12 px-6 text-base rounded-full gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
