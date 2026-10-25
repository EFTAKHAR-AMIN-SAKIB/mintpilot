"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Copy,
  Check,
  ExternalLink,
  Shield,
  RefreshCw,
  AlertTriangle,
  QrCode,
  Wallet,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { WalletSessionInfo } from "@/types";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletSessionInfo;
  onStartPairing: () => Promise<void>;
  onConfirmPairing?: (address?: string) => Promise<void>;
  onConnectAddress?: (address: string, agentId?: string) => Promise<void>;
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
  onConnectAddress,
  onDisconnect,
  isLoading,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [connectTab, setConnectTab] = useState<"mpc" | "custom">("mpc");
  const [customAddressInput, setCustomAddressInput] = useState("");
  const [hasExtension, setHasExtension] = useState(false);

  const isConnected = wallet.status === "CONNECTED";
  const isPairing = wallet.status === "PAIRING";

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setHasExtension(true);
    }
  }, []);

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectBrowserExtension = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts[0] && onConnectAddress) {
        await onConnectAddress(accounts[0]);
      }
    } catch (err) {
      console.error("Extension connection error:", err);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddressInput.trim() || !onConnectAddress) return;
    onConnectAddress(customAddressInput.trim());
  };

  const handleSelectPreset = (addr: string, agentId?: string) => {
    setCustomAddressInput(addr);
    if (onConnectAddress) {
      onConnectAddress(addr, agentId);
    }
  };

  const displayAgentId =
    wallet.agentId ||
    (wallet.address?.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4"
      ? "eftakhar.ai"
      : "yourname.ai");

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isConnected ? "Binance Agentic Wallet" : "Connect Binance Agentic Wallet"}
      description={
        isConnected
          ? "Connected via Binance Agentic Wallet Keyless MPC on BNB Smart Chain"
          : "Choose your preferred connection method to interact with MintPilot"
      }
    >
      <div className="space-y-4">
        {isConnected ? (
          /* ================= Connected State ================= */
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl seer-glass space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[var(--muted)] uppercase font-semibold tracking-wider block">
                    My Agent ID
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight font-mono select-all inline-block whitespace-nowrap">
                    {displayAgentId}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

              {/* Balance, Network and limits */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted)] block">Native Balance</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                    {wallet.bnbBalance ? `${wallet.bnbBalance} BNB` : "0.0000 BNB"}
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
            </div>

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
                Disconnect & Switch Wallet
              </button>
            </div>
          </div>
        ) : isPairing && wallet.pairingData ? (
          /* ================= QR Pairing State ================= */
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white rounded-2xl border border-[var(--border)] inline-block shadow-md">
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
              <div className="text-xs font-medium text-[var(--muted)]">
                Pairing Code:{" "}
                <span className="font-mono text-[var(--ink)] font-semibold px-2 py-0.5 rounded bg-[var(--capsule)] border border-[var(--border)] text-sm">
                  {wallet.pairingData.pairingCode}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                Scan with the Binance App or open the direct link on your mobile device to authorize.
              </p>
              {wallet.pairingData.urlForWeb && (
                <a
                  href={wallet.pairingData.urlForWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline pt-1"
                >
                  Open direct link <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)] pt-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Waiting for confirmation in Binance App...</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onConfirmPairing && (
                <button
                  onClick={() => onConfirmPairing()}
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
          /* ================= Idle / Initial Unconnected State ================= */
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Connection Mode Switcher */}
            <div className="flex rounded-xl bg-[var(--capsule)] p-1 border border-[var(--border)] text-xs">
              <button
                onClick={() => setConnectTab("mpc")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  connectTab === "mpc"
                    ? "seer-btn-violet text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Binance MPC App</span>
              </button>
              <button
                onClick={() => setConnectTab("custom")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  connectTab === "custom"
                    ? "seer-btn-violet text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Address / Agent ID</span>
              </button>
            </div>

            {connectTab === "mpc" ? (
              /* Tab 1: Keyless MPC Pairing */
              <div className="space-y-3.5">
                <div className="p-4 sm:p-5 rounded-2xl seer-glass space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Non-Custodial MPC Security</span>
                  </div>
                  <p className="text-xs text-[#9b9aab] leading-relaxed">
                    MintPilot connects with Binance Agentic Wallet using Multi-Party Computation. Private keys are never exposed, and only previewed transactions approved by you can be broadcasted.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white border border-white/[0.08] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onStartPairing}
                    disabled={isLoading}
                    className="seer-btn-violet px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Start Pairing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Custom Address or Agent ID */
              <div className="space-y-3.5">
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--muted)] block mb-1.5">
                      Enter BSC Address or Agent Name (.ai)
                    </label>
                    <input
                      type="text"
                      value={customAddressInput}
                      onChange={(e) => setCustomAddressInput(e.target.value)}
                      placeholder="e.g. 0x... or eftakhar.ai"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)] focus:border-purple-500 text-xs font-mono text-[var(--ink)] placeholder:text-[var(--faint)] outline-none transition-colors"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <span className="text-[10px] text-[var(--muted)] uppercase font-semibold tracking-wider block mb-1.5">
                      Quick Connect Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectPreset("0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4", "eftakhar.ai")
                        }
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 text-[11px] font-mono transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>eftakhar.ai (Proof of Agent #4547)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rand =
                            "0x" +
                            Array.from({ length: 40 }, () =>
                              Math.floor(Math.random() * 16).toString(16)
                            ).join("");
                          handleSelectPreset(rand);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)] text-[11px] font-mono transition-colors"
                      >
                        + Fresh Clean Wallet
                      </button>
                    </div>
                  </div>

                  {hasExtension && (
                    <button
                      type="button"
                      onClick={handleConnectBrowserExtension}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/25 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Connect Browser Extension (MetaMask / Trust)</span>
                    </button>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white border border-white/[0.08] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !customAddressInput.trim()}
                      className="seer-btn-violet px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      <span>Connect Wallet</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
