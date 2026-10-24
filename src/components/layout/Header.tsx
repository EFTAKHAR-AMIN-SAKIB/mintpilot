"use client";

import React from "react";
import { Compass, ShieldCheck, History, Sun, Moon, Sparkles } from "lucide-react";
import { WalletSessionInfo } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  wallet: WalletSessionInfo;
  onOpenWalletModal: () => void;
  onToggleActivityDrawer: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  networkName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  onOpenWalletModal,
  onToggleActivityDrawer,
  theme,
  onToggleTheme,
  networkName = "BNB Smart Chain",
}) => {
  const isConnected = wallet.status === "CONNECTED";
  const isPairing = wallet.status === "PAIRING";

  const formatAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-apple-border/60 bg-apple-bg/80 backdrop-blur-xl dark:border-apple-darkBorder/60 dark:bg-apple-darkBg/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-apple-blue flex items-center justify-center text-white shadow-sm">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-apple-text dark:text-apple-darkText">
                MintPilot
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-black/5 dark:bg-white/10 text-apple-secondary dark:text-apple-darkSecondary">
                Agentic
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-apple-secondary dark:text-apple-darkSecondary leading-none">
              Your intent. Your wallet. Your choice.
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-surface dark:bg-apple-darkSurface border border-apple-border dark:border-apple-darkBorder text-xs text-apple-secondary dark:text-apple-darkSecondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{networkName}</span>
          </div>

          {/* Dev Mode Pill if active */}
          {wallet.isDevelopmentProvider && (
            <Badge variant="dev" className="hidden sm:inline-flex">
              <Sparkles className="w-3 h-3" />
              Dev Mode
            </Badge>
          )}

          {/* Wallet Button */}
          {isConnected ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-apple-surface dark:bg-apple-darkSurface border border-apple-border dark:border-apple-darkBorder text-xs font-mono font-medium text-apple-text dark:text-apple-darkText hover:border-apple-blue/50 transition-colors shadow-sm"
              title="View wallet & session details"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formatAddress(wallet.address)}</span>
            </button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenWalletModal}
              isLoading={isPairing}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {isPairing ? "Pairing..." : "Connect Binance Wallet"}
            </Button>
          )}

          {/* Activity Drawer Toggle */}
          <button
            onClick={onToggleActivityDrawer}
            className="p-2 rounded-full text-apple-secondary hover:text-apple-text hover:bg-black/5 dark:text-apple-darkSecondary dark:hover:text-apple-darkText dark:hover:bg-white/10 transition-colors"
            title="Activity & Transaction History"
            aria-label="Activity history"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full text-apple-secondary hover:text-apple-text hover:bg-black/5 dark:text-apple-darkSecondary dark:hover:text-apple-darkText dark:hover:bg-white/10 transition-colors"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
