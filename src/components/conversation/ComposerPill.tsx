"use client";

import React, { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";

interface ComposerPillProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSelectPrompt?: (text: string) => void;
}

export const ComposerPill: React.FC<ComposerPillProps> = ({
  onSendMessage,
  isLoading,
  disabled,
  placeholder,
}) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6 pt-1 sm:pt-2 select-none">
      {/* Main Seer-Style Glass Pill Bar */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 sm:gap-3 pl-4 sm:pl-6 pr-1.5 sm:pr-2 py-1.5 sm:py-2 rounded-full seer-glass-pill shadow-2xl focus-within:ring-2 focus-within:ring-purple-500/30 transition-all border border-[var(--border)]"
      >
        {/* Input Text Field */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || isLoading}
          placeholder={placeholder || "Message MintPilot or paste collection URL..."}
          className="flex-1 bg-transparent text-sm sm:text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none min-w-0 font-normal select-text"
        />

        {/* Send Arrow Button */}
        <button
          type="submit"
          disabled={!text.trim() || isLoading || disabled}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full seer-btn-violet flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shrink-0 cursor-pointer text-white"
          aria-label="Send prompt"
          title="Send message"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-white"
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
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
};
