"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, Shield, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WalletSessionInfo } from "@/types";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletSessionInfo;
  onStartPairing: () => Promise<void>;
  onConfirmPairing?: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onStartPairing,
  onConfirmPairing,
  onDisconnect,
  isLoading,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const isConnected = wallet.status === "CONNECTED";
  const isPairing = wallet.status === "PAIRING";

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isConnected ? "Binance Agentic Wallet" : "Connect Binance Agentic Wallet"}
      description={
        isConnected
          ? "Authenticated via Binance Web3 MPC infrastructure"
          : "Secure keyless connection via the Binance Mobile App"
      }
    >
      <div className="space-y-5">
        {/* Development Mode Notice Banner */}
        {wallet.isDevelopmentProvider && (
          <div className="p-3 rounded-apple-sm bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="font-medium">Development Mode Active</p>
              <p className="text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                Simulated provider active for safe testing without risking real BNB funds or needing physical mobile app access.
              </p>
            </div>
          </div>
        )}

        {isConnected ? (
          /* Connected State */
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl seer-glass space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[var(--muted)] uppercase font-semibold tracking-wider block">
                    My Agent ID
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight font-mono select-all inline-block whitespace-nowrap">
                    {wallet.agentId || (wallet.address?.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4" ? "eftakhar.ai" : "forkmaster.ai")}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between bg-[var(--capsule)] p-3 rounded-xl border border-[var(--border)] gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-[var(--muted)] block font-mono">Address</span>
                  <span className="text-xs font-mono text-[var(--ink)] truncate block font-medium">
                    {wallet.address}
                  </span>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] transition-colors shrink-0"
                  title="Copy full address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Session Validity & Device info from Binance app */}
              <div className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)] text-xs text-[var(--muted)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] block">Signed in until</span>
                  <span className="font-mono text-[var(--ink)] font-medium text-xs">2026-10-27 06:19:35</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] block">Device</span>
                  <span className="font-mono text-[var(--faint)] text-[11px]">Windows • Feni BD</span>
                </div>
              </div>

              {/* Balance, Network and limits */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Native Balance</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                    {wallet.bnbBalance ? `${wallet.bnbBalance} BNB` : "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Network</span>
                  <span className="font-medium text-[var(--ink)] text-xs mt-0.5 block">BNB Smart Chain (56)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Wallet Mode</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {wallet.isDevMode ? "Dev Sandbox" : "Live Mainnet"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Keyless MPC</span>
                  <span className="font-medium text-[var(--ink)] text-xs mt-0.5 block">Active</span>
                </div>
              </div>

              {wallet.dailySpendingLimit && (
                <div className="pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block">Daily Limit</span>
                    <span className="font-medium text-[var(--ink)]">
                      ${wallet.dailySpendingLimit.totalLimitUsd || "50,000"} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block">Remaining Quota</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${wallet.dailySpendingLimit.remainingQuotaUsd || "50,000"} USD
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Your wallet stays in your control. The AI can interpret and preview actions, but you authorize every transaction.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-xs font-medium text-[var(--ink)] border border-[var(--border)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={onDisconnect}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : isPairing && wallet.pairingData ? (
          /* QR Pairing State */
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white rounded-2xl border border-hark-border inline-block shadow-md">
              {wallet.pairingData.qrDataUrl ? (
                <Image
                  src={wallet.pairingData.qrDataUrl}
                  alt="Binance Wallet Pairing QR Code"
                  width={220}
                  height={220}
                  className="mx-auto rounded"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-xs text-gray-500">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium text-apple-secondary dark:text-apple-darkSecondary">
                Pairing Code:{" "}
                <span className="font-mono text-apple-text dark:text-apple-darkText font-semibold px-2 py-0.5 rounded bg-apple-subtle dark:bg-apple-darkSubtle text-sm">
                  {wallet.pairingData.pairingCode}
                </span>
              </div>
              <p className="text-xs text-apple-secondary dark:text-apple-darkSecondary max-w-sm mx-auto">
                Scan with the Binance App or open link on your mobile device to authorize this session.
              </p>
              {wallet.pairingData.urlForWeb && (
                <a
                  href={wallet.pairingData.urlForWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-apple-blue hover:underline pt-1"
                >
                  Open direct link <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-apple-secondary dark:text-apple-darkSecondary pt-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Waiting for confirmation in Binance App...</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onConfirmPairing && (
                <button
                  onClick={onConfirmPairing}
                  disabled={isLoading}
                  className="seer-btn-violet w-full py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Confirm & Connect Session</span>
                </button>
              )}

              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={onStartPairing} isLoading={isLoading}>
                  Refresh QR
                </Button>
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Idle / Initial State */
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-4 sm:p-5 rounded-2xl seer-glass space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Non-Custodial MPC Security</span>
              </div>
              <p className="text-xs text-[#9b9aab] leading-relaxed">
                MintPilot connects with Binance Agentic Wallet using Multi-Party Computation. Private keys are never exposed, and only previewed transactions approved by you can be broadcasted.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white border border-white/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onStartPairing}
                disabled={isLoading}
                className="seer-btn-violet px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 min-w-[130px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Start Pairing</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
