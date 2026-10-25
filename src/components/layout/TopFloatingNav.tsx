"use client";

import React from "react";
import Image from "next/image";
import { LivingAgentLogo } from "@/components/brand/LivingAgentLogo";
import { MessageSquare, Clock, Search, Menu, Layers, Moon, Sun, ShieldCheck, SquarePen } from "lucide-react";
import { WalletSessionInfo } from "@/types";

interface TopFloatingNavProps {
  activeTab: "chat" | "vault" | "activity";
  onTabChange: (tab: "chat" | "vault" | "activity") => void;
  wallet: WalletSessionInfo;
  onOpenWalletModal: () => void;
  onToggleMobileDeck?: () => void;
  onOpenInspectModal?: () => void;
  onNewChat?: () => void;
  nftsCount?: number;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export const TopFloatingNav: React.FC<TopFloatingNavProps> = ({
  activeTab,
  onTabChange,
  wallet,
  onOpenWalletModal,
  onToggleMobileDeck,
  onOpenInspectModal,
  onNewChat,
  nftsCount = 0,
  theme = "dark",
  onToggleTheme,
}) => {
  const isConnected = wallet.status === "CONNECTED";
  const avatarChar = wallet.address ? wallet.address.slice(2, 4).toUpperCase() : "MP";
  const fallbackAgentId = wallet.address?.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4" ? "eftakhar.ai" : "forkmaster.ai";
  const displayAgentId = wallet.agentId || fallbackAgentId;

  const tabButtons = (
    <>
      <button
        onClick={() => onTabChange("chat")}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          activeTab === "chat"
            ? "seer-btn-violet shadow-md text-white"
            : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--capsule)]"
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
        <span>Chat</span>
      </button>

      <button
        onClick={() => onTabChange("vault")}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          activeTab === "vault"
            ? "seer-btn-violet shadow-md text-white"
            : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--capsule)]"
        }`}
      >
        <Layers className="w-3.5 h-3.5 shrink-0" />
        <span>Vault</span>
        {nftsCount > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === "vault"
                ? "bg-white/20 text-white"
                : "bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25"
            }`}
          >
            {nftsCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onTabChange("activity")}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          activeTab === "activity"
            ? "seer-btn-violet shadow-md text-white"
            : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--capsule)]"
        }`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Activity</span>
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-30 w-full px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 pointer-events-none select-none">
      {/* ----------------- DESKTOP NAVIGATION (lg and up) ----------------- */}
      <div className="hidden lg:grid grid-cols-3 items-center w-full">
        {/* Left: Network context & Active status (No redundant New Chat, sidebar already has it) */}
        <div className="flex items-center justify-start pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full seer-glass text-xs font-mono text-[var(--muted)] border border-[var(--border)] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold text-[var(--ink)] font-sans">BNB Chain</span>
            <span className="text-[10px] text-[var(--muted)]">#56</span>
          </div>
        </div>

        {/* Center: Centered Segmented Tab Switcher */}
        <div className="flex items-center justify-center pointer-events-auto">
          <nav
            aria-label="Workspace views"
            className="flex items-center p-1.5 seer-glass-pill shadow-xl"
          >
            {tabButtons}
          </nav>
        </div>

        {/* Right: Theme Toggle, Search / Inspect & Wallet CTA */}
        <div className="flex items-center justify-end gap-2.5 pointer-events-auto">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full seer-glass text-[var(--muted)] hover:text-[var(--ink)] hover:scale-105 transition-all shadow-sm cursor-pointer"
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>
          )}

          {onOpenInspectModal && (
            <button
              onClick={onOpenInspectModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full seer-glass text-xs font-semibold text-[var(--ink)] hover:scale-105 shadow-sm transition-all cursor-pointer"
              title="Inspect any contract address or collection on BSC"
            >
              <Search className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Inspect</span>
            </button>
          )}

          {isConnected ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full seer-glass text-xs font-mono text-[var(--ink)] hover:scale-105 transition-all shadow-sm cursor-pointer"
              title={`Connected Agent ID: ${displayAgentId} (${wallet.address})`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold font-mono text-xs">{displayAgentId}</span>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="seer-btn-violet flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- MOBILE NAVIGATION (< lg) ----------------- */}
      <div className="lg:hidden flex flex-col gap-2 w-full">
        {/* Row 1: Actions, Wordmark, and Account Controls */}
        <div className="flex items-center justify-between w-full pointer-events-auto">
          {/* Mobile Left: Menu Toggle + New Chat */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMobileDeck}
              className="p-2 rounded-full seer-glass text-[var(--ink)] shadow-sm hover:scale-105 transition-all cursor-pointer"
              title="Toggle Sidebar Deck"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {onNewChat && (
              <button
                onClick={onNewChat}
                className="p-2 rounded-full seer-glass text-[#7d33ff] dark:text-purple-300 shadow-sm hover:scale-105 transition-all cursor-pointer"
                title="Start a new chat session"
                aria-label="New Chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Center: Brand Wordmark */}
          <div className="flex items-center gap-1.5">
            <LivingAgentLogo size="sm" showAura={false} />
            <span className="font-bold text-xs tracking-tight text-[var(--ink)]">mintpilot</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/25">
              agentic
            </span>
          </div>

          {/* Mobile Right: Theme Toggle, Inspect, & Wallet */}
          <div className="flex items-center gap-1.5">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-full seer-glass text-[var(--muted)] hover:text-[var(--ink)] shadow-sm cursor-pointer"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-purple-600" />}
              </button>
            )}

            {onOpenInspectModal && (
              <button
                onClick={onOpenInspectModal}
                className="p-2 rounded-full seer-glass text-[var(--muted)] hover:text-[var(--ink)] shadow-sm cursor-pointer"
                title="Inspect contract or collection"
                aria-label="Inspect contract"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            {isConnected ? (
              <button
                onClick={onOpenWalletModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full seer-glass text-xs font-mono text-[var(--ink)] shadow-sm cursor-pointer"
                title={`Connected: ${displayAgentId}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-xs">{avatarChar}</span>
              </button>
            ) : (
              <button
                onClick={onOpenWalletModal}
                className="seer-btn-violet flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-md cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Dedicated Segmented Switcher Pill */}
        <div className="flex items-center justify-center w-full pointer-events-auto pt-0.5">
          <nav
            aria-label="Workspace views"
            className="flex items-center w-full max-w-[340px] p-1 seer-glass-pill shadow-xl"
          >
            {tabButtons}
          </nav>
        </div>
      </div>
    </header>
  );
};
