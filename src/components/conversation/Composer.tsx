"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Link2, Sparkles } from "lucide-react";

interface ComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isLoading,
  disabled,
  placeholder = "What would you like to do on-chain?",
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading || disabled) return;
    onSendMessage(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInsertUrl = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip && (clip.startsWith("http://") || clip.startsWith("https://"))) {
        setText((prev) => (prev ? `${prev} ${clip}` : `Mint 1 NFT from ${clip}`));
      }
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="relative rounded-apple bg-apple-surface dark:bg-apple-darkSurface border border-apple-border dark:border-apple-darkBorder shadow-apple focus-within:border-apple-blue/50 dark:focus-within:border-apple-blue/50 transition-all duration-200 overflow-hidden"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-sm sm:text-base text-apple-text dark:text-apple-darkText placeholder:text-apple-secondary dark:placeholder:text-apple-darkSecondary focus:outline-none"
        />

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* URL quick action */}
          <button
            type="button"
            onClick={handleInsertUrl}
            className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs text-apple-secondary hover:text-apple-text dark:text-apple-darkSecondary dark:hover:text-apple-darkText hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            title="Paste link from clipboard"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste URL</span>
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!text.trim() || isLoading || disabled}
            className="pointer-events-auto w-8 h-8 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 shadow-sm"
            aria-label="Send prompt"
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
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </form>
      <div className="text-center mt-2">
        <span className="text-[11px] text-apple-secondary dark:text-apple-darkSecondary">
          MintPilot verifies every contract and prepares a Binance Agentic Wallet preview before you confirm.
        </span>
      </div>
    </div>
  );
};
