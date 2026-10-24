"use client";

import React from "react";
import { Sparkles, ArrowRight, Globe, HelpCircle } from "lucide-react";

interface WelcomeScreenProps {
  onSelectSuggestion: (text: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    {
      title: "Help me mint an NFT",
      description: "Mint 1 NFT from Pixel Garden on BNB Smart Chain for 0.01 BNB",
      prompt: "Mint 1 NFT from Pixel Garden for 0.01 BNB",
      icon: Sparkles,
    },
    {
      title: "Mint an NFT from a website",
      description: "Resolve contract address and price safely from an official mint URL",
      prompt: "Mint 1 NFT from https://example.com/mint for 0.01 BNB",
      icon: Globe,
    },
    {
      title: "Explain how NFT minting works",
      description: "Learn how the two-step preview and Binance Agentic Wallet protect you",
      prompt: "Explain how NFT minting works on BNB Chain with Binance Agentic Wallet",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4 max-w-xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-apple-text dark:text-apple-darkText">
          Make something on-chain.
        </h1>
        <p className="text-sm sm:text-base text-apple-secondary dark:text-apple-darkSecondary leading-relaxed">
          Tell me what you want to do. I’ll find the details, explain the transaction, and let you review everything before anything is submitted.
        </p>
      </div>

      <div className="w-full space-y-2.5 text-left">
        <span className="text-xs font-medium text-apple-secondary dark:text-apple-darkSecondary uppercase tracking-wider px-1">
          Suggestions
        </span>
        <div className="space-y-2">
          {suggestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(item.prompt)}
                className="w-full group flex items-center justify-between p-3.5 rounded-apple bg-apple-surface dark:bg-apple-darkSurface border border-apple-border dark:border-apple-darkBorder hover:border-apple-blue/50 dark:hover:border-apple-blue/50 shadow-sm transition-all duration-150 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-apple-subtle dark:bg-apple-darkSubtle flex items-center justify-center text-apple-secondary group-hover:text-apple-blue transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-apple-text dark:text-apple-darkText group-hover:text-apple-blue transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-apple-secondary dark:text-apple-darkSecondary">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-apple-secondary group-hover:text-apple-blue group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
