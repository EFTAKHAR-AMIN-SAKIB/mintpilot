"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Globe, HelpCircle, Cpu } from "lucide-react";
import { LivingAgentLogo } from "@/components/brand/LivingAgentLogo";

interface WelcomeScreenProps {
  onSelectSuggestion: (text: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    {
      title: "Mint from live project website",
      description: "Auto-resolve verified contract, mint function, and gas directly from an official URL",
      prompt: "mint the nft from https://aivy.me/",
      icon: Globe,
      badge: "Live Website",
      badgeColor: "text-purple-600 dark:text-purple-300 bg-purple-500/10 border-purple-500/25",
    },
    {
      title: "Direct contract mint on BSC",
      description: "Direct BEP-721 robot mint on verified contract 0x77cCE940d1Fe4808aB6cf8484d45d8B51139E7D6",
      prompt: "Help me mint from contract 0x77cCE940d1Fe4808aB6cf8484d45d8B51139E7D6",
      icon: Cpu,
      badge: "Verified Contract",
      badgeColor: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      title: "How Binance Agentic Wallet works",
      description: "Learn how the two-step preview, simulation, and MPC keyless security protect your funds",
      prompt: "Explain how NFT minting works on BNB Chain with Binance Agentic Wallet",
      icon: HelpCircle,
      badge: "MPC Security",
      badgeColor: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center py-6 sm:py-12 md:py-16 px-3 sm:px-4 max-w-2xl mx-auto space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in w-full select-none">
      {/* Living Agent Hero Avatar & Subtitle */}
      <div className="space-y-4 flex flex-col items-center">
        <LivingAgentLogo size="xl" interactive={true} showAura={true} />

        <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-[#7d33ff] dark:text-purple-300 seer-glass-pill px-3.5 py-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Binance Agentic Wallet × Gemini</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink)]">
          Make something on-chain.
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-[var(--muted)] leading-relaxed max-w-xl mx-auto px-2">
          Agentic decision infrastructure. <b className="text-[var(--ink)] font-semibold">One prompt, verified bytecode, keyless MPC execution</b> on BNB Smart Chain.
        </p>
      </div>

      {/* Seer-Style Layered Frosted Glass Intent Cards */}
      <div className="w-full space-y-2.5 sm:space-y-3 text-left">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Verified Actions & Intents
          </span>
          <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% On-Chain Verified
          </span>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {suggestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(item.prompt)}
                className="w-full group flex items-center justify-between p-3.5 sm:p-4 md:p-5 seer-glass hover:scale-[1.01] transition-all duration-200 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4.5 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[var(--capsule)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] group-hover:text-[#7d33ff] dark:group-hover:text-purple-300 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 justify-between sm:justify-start">
                      <h4 className="text-xs sm:text-sm md:text-base font-semibold text-[var(--ink)] group-hover:text-[#7d33ff] dark:group-hover:text-purple-300 transition-colors truncate">
                        {item.title}
                      </h4>
                      <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono border shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs md:text-[13px] text-[var(--muted)] line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--capsule)] group-hover:bg-[#7d33ff] group-hover:text-white flex items-center justify-center text-[var(--muted)] transition-all shrink-0 ml-1 sm:ml-2">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
