"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Surface */}
      <div className="relative w-full max-w-lg rounded-apple-lg bg-apple-surface dark:bg-apple-darkSurface border border-apple-border dark:border-apple-darkBorder p-6 shadow-apple-floating transition-all duration-200 z-10">
        <div className="flex items-start justify-between pb-4 border-b border-apple-border/50 dark:border-apple-darkBorder/50">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-apple-text dark:text-apple-darkText tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-apple-secondary dark:text-apple-darkSecondary mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-apple-secondary hover:text-apple-text hover:bg-black/5 dark:text-apple-darkSecondary dark:hover:text-apple-darkText dark:hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
