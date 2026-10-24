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
  onDisconnect: () => Promise<void>;
  isLoading?: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onStartPairing,
  onDisconnect,
  isLoading,
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
            <div className="p-4 rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-apple-secondary dark:text-apple-darkSecondary font-medium">
                  Wallet Address
                </span>
                <Badge variant="success">Connected</Badge>
              </div>

              <div className="flex items-center justify-between bg-apple-surface dark:bg-apple-darkSurface p-2.5 rounded-lg border border-apple-border dark:border-apple-darkBorder">
                <span className="text-xs font-mono text-apple-text dark:text-apple-darkText truncate max-w-[280px]">
                  {wallet.address}
                </span>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded text-apple-secondary hover:text-apple-text transition-colors"
                  title="Copy full address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Network and limits */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-apple-secondary dark:text-apple-darkSecondary block">Network</span>
                  <span className="font-medium text-apple-text dark:text-apple-darkText">BNB Smart Chain</span>
                </div>
                <div>
                  <span className="text-apple-secondary dark:text-apple-darkSecondary block">Developer Mode</span>
                  <span className="font-medium text-apple-text dark:text-apple-darkText">
                    {wallet.isDevMode ? "Enabled" : "Standard"}
                  </span>
                </div>
              </div>

              {wallet.dailySpendingLimit && (
                <div className="pt-2 border-t border-apple-border/50 dark:border-apple-darkBorder/50 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-apple-secondary dark:text-apple-darkSecondary block">Daily Limit</span>
                    <span className="font-medium text-apple-text dark:text-apple-darkText">
                      ${wallet.dailySpendingLimit.totalLimitUsd || "500.00"}
                    </span>
                  </div>
                  <div>
                    <span className="text-apple-secondary dark:text-apple-darkSecondary block">Remaining Quota</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${wallet.dailySpendingLimit.remainingQuotaUsd || "485.50"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-apple-secondary dark:text-apple-darkSecondary">
              Your wallet stays in your control. The AI can interpret and preview actions, but you authorize every transaction.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button variant="danger" size="sm" onClick={onDisconnect} isLoading={isLoading}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : isPairing && wallet.pairingData ? (
          /* QR Pairing State */
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white dark:bg-white rounded-apple-sm border border-apple-border inline-block shadow-sm">
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
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-apple-blue" />
              <span>Waiting for confirmation in Binance App...</span>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onStartPairing} isLoading={isLoading}>
                Refresh QR
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Idle / Initial State */
          <div className="space-y-4">
            <div className="p-4 rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-apple-text dark:text-apple-darkText">
                <Shield className="w-4 h-4 text-apple-blue" />
                <span>Non-Custodial MPC Security</span>
              </div>
              <p className="text-xs text-apple-secondary dark:text-apple-darkSecondary">
                MintPilot connects with Binance Agentic Wallet using Multi-Party Computation. Private keys are never exposed, and only previewed transactions approved by you can be broadcasted.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={onStartPairing} isLoading={isLoading}>
                Start Pairing
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
