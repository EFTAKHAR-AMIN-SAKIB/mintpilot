"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { LivingAgentLogo } from "@/components/brand/LivingAgentLogo";
import {
  Compass,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Flame,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Clock,
  Layers,
  ArrowUpRight,
  Radio,
  Zap,
  Share2,
  Plus,
  SquarePen,
} from "lucide-react";
import { WalletSessionInfo, OwnedNFT } from "@/types";
import { getExplorerAddressUrl } from "@/lib/network/config";

interface NetworkMetrics {
  gasPriceGwei: string;
  blockNumber: number;
  estGasBnb: string;
  estGasUsd: string;
  status: string;
}

interface AgenticDeckProps {
  wallet: WalletSessionInfo;
  onOpenWalletModal: () => void;
  onOpenActivity: () => void;
  onOpenVault?: () => void;
  onSelectPrompt: (prompt: string) => void;
  onNewChat?: () => void;
  activitiesCount?: number;
  nfts?: OwnedNFT[];
  agentId?: string;
}

export const AgenticDeck: React.FC<AgenticDeckProps> = ({
  wallet,
  onOpenWalletModal,
  onOpenActivity,
  onOpenVault,
  onSelectPrompt,
  onNewChat,
  activitiesCount = 0,
  nfts = [],
  agentId: propAgentId,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedAgentId, setCopiedAgentId] = useState(false);
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(false);
  const fallbackAgentId = wallet.address?.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4" ? "eftakhar.ai" : "forkmaster.ai";
  const agentId = wallet.agentId || propAgentId || fallbackAgentId;

  const copyAgentId = () => {
    navigator.clipboard.writeText(agentId);
    setCopiedAgentId(true);
    setTimeout(() => setCopiedAgentId(false), 2000);
  };
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    gasPriceGwei: "0.05",
    blockNumber: 129545000,
    estGasBnb: "0.000009",
    estGasUsd: "< $0.01",
    status: "ONLINE",
  });

  const isConnected = wallet.status === "CONNECTED";

  // Fetch live on-chain BSC metrics every 15 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/network/metrics");
        if (res.ok) {
          const data = await res.json();
          if (data && isMounted) {
            setMetrics({
              gasPriceGwei: data.gasPriceGwei || "0.05",
              blockNumber: data.blockNumber || 129545000,
              estGasBnb: data.estGasBnb || "0.000009",
              estGasUsd: data.estGasUsd || "< $0.01",
              status: data.status || "ONLINE",
            });
          }
        }
      } catch {
        // silent fallback to last valid state
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : "";

  const formattedBlock = metrics.blockNumber
    ? `#${metrics.blockNumber.toLocaleString()}`
    : "#129,545,000";

  return (
    <aside className="w-full lg:w-[335px] xl:w-[355px] shrink-0 flex flex-col gap-3.5 p-4 sm:p-5 select-none relative z-10">
      {/* 1. Top Brand Pill */}
      <div className="flex items-center gap-3 pb-1">
        <LivingAgentLogo size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-[var(--ink)]">mintpilot</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25 font-semibold">
              agentic
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)]">Your intent. Your wallet.</p>
        </div>
      </div>

      {/* New Chat Primary Action Button */}
      {onNewChat && (
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3.5 rounded-2xl seer-glass hover:bg-[var(--capsule-hover)] border border-[var(--border)] hover:border-purple-500/40 text-xs font-semibold text-[var(--ink)] flex items-center justify-between shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
          title="Start a new chat session"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg seer-btn-violet flex items-center justify-center text-white shadow-sm">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="group-hover:text-[#7d33ff] dark:group-hover:text-purple-300 transition-colors">
              New Chat
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--capsule)] text-[var(--muted)] border border-[var(--border)]">
            + New
          </span>
        </button>
      )}

      {/* 2. Hero Wallet Card with Clean Agent ID */}
      <div className="p-4 sm:p-5 seer-glass space-y-3 shadow-xl">
        <div>
          {/* Clean Agent ID Card */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] transition-all hover:border-[var(--border-hover)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--muted)] uppercase font-semibold tracking-wider">
                My Agent ID
              </span>
              <button
                onClick={copyAgentId}
                className="p-1 rounded-md text-[var(--muted)] hover:text-[#7d33ff] dark:hover:text-purple-300 transition-colors shrink-0"
                title="Copy Agent ID"
              >
                {copiedAgentId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight font-mono select-all inline-block whitespace-nowrap">
                {agentId}
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)] leading-relaxed mt-2.5">
            AI interprets your natural intent. Verified application logic enforces safety before your MPC wallet signs.
          </p>
        </div>

        {isConnected ? (
          <div className="space-y-2.5 pt-1">
            {/* Address pill */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--capsule)] border border-[var(--border)]">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--ink)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{formattedAddress}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={copyAddress}
                  className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  title="Copy wallet address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {wallet.address && (
                  <a
                    href={getExplorerAddressUrl(wallet.address, 56)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md text-[var(--muted)] hover:text-[#7d33ff] transition-colors"
                    title="View on BscScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Essential: Native Wallet Balance */}
            <div className="p-3 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--muted)] block uppercase font-medium">Wallet Balance</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-bold font-mono text-[var(--ink)]">$0.12385</span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    ({wallet.bnbBalance || "0.0001"} BNB)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono text-purple-600 dark:text-purple-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Gas Ready</span>
              </div>
            </div>

            {/* Collapsible Technical Session Panel */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--capsule)] overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsSessionDetailsOpen((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer select-none"
                aria-expanded={isSessionDetailsOpen}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-medium">Session & Security</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200 ${
                    isSessionDetailsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSessionDetailsOpen && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--border)] animate-fade-in text-[11px]">
                  <div className="flex items-center justify-between text-[var(--muted)]">
                    <span>Security Model</span>
                    <span className="font-mono text-[var(--ink)] font-medium">Keyless MPC</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--muted)]">
                    <span>Signed in until</span>
                    <span className="font-mono text-[var(--ink)] font-medium">
                      2026-10-27 06:19:35
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--muted)]">
                    <span>Device & Location</span>
                    <span className="font-mono text-[var(--faint)] text-[10px]">
                      Windows 10.0.26200 • Feni BD
                    </span>
                  </div>

                  <button
                    onClick={onOpenWalletModal}
                    className="w-full mt-1.5 py-1.5 px-2.5 rounded-xl seer-glass hover:bg-[var(--capsule-hover)] text-xs text-[var(--ink)] font-medium border border-[var(--border)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Manage Wallet Session</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenWalletModal}
            className="w-full py-3 px-4 rounded-2xl seer-btn-violet font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Connect Binance Wallet</span>
          </button>
        )}
      </div>

      {/* 3. Wallet NFT Inventory Showcase */}
      {isConnected && (
        <div className="p-5 seer-glass space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7d33ff] dark:text-purple-400" />
              <span className="text-xs font-bold text-[var(--ink)] tracking-tight">Wallet Vault</span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25 font-bold">
              {nfts.length} {nfts.length === 1 ? "Collectible" : "Collectibles"}
            </span>
          </div>

          {nfts.length > 0 ? (
            <div className="space-y-2.5">
              {/* Latest NFT Card preview */}
              <div
                onClick={onOpenVault}
                className="group flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] border border-[var(--border)] cursor-pointer transition-all"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-purple-950/20 border border-[var(--border)] shrink-0">
                  {nfts[0].imageUrl ? (
                    <Image
                      src={nfts[0].imageUrl}
                      alt={nfts[0].name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--ink)] truncate">
                      {nfts[0].name}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--muted)] font-mono block mt-0.5">
                    Token #{nfts[0].tokenId} • BEP-721
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors" />
              </div>

              <button
                onClick={onOpenVault}
                className="w-full py-2 px-3 rounded-2xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-xs text-[var(--muted)] hover:text-[var(--ink)] font-medium border border-[var(--border)] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Open Full Vault Gallery</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] text-center">
              <p className="text-xs text-[var(--muted)]">No NFTs in wallet yet</p>
            </div>
          )}
        </div>
      )}

      {/* 4. Live On-Chain Context Widget with Real RPC Data */}
      <div className="p-5 seer-glass space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#7d33ff] dark:text-purple-400" />
            <span className="text-xs font-bold text-[var(--ink)] tracking-tight">BNB Smart Chain</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 font-semibold">
            <Radio className="w-3 h-3 animate-pulse" />
            Live RPC
          </span>
        </div>

        {/* 3 Metric Pills with Live Verified BSC Data */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-[var(--capsule)] border border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted)] block">Base Gas</span>
            <span className="text-xs font-mono font-bold text-[var(--ink)] mt-0.5 block">
              {metrics.gasPriceGwei} Gwei
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[var(--capsule)] border border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted)] block">Est. Mint</span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {metrics.estGasUsd}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-[var(--capsule)] border border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted)] block">Latest Block</span>
            <span className="text-[11px] font-mono font-bold text-[var(--ink)] truncate block mt-0.5" title={String(metrics.blockNumber)}>
              {formattedBlock}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)] pt-0.5">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-time on-chain RPC • Zero gas markups</span>
        </div>

        <button
          onClick={() => onSelectPrompt("Explain how NFT minting works on BNB Chain with Binance Agentic Wallet")}
          className="w-full py-2.5 px-3 rounded-2xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-xs text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>How Agentic Minting Works</span>
        </button>
      </div>

      {/* 5. Transaction History Switcher Pill */}
      <button
        onClick={onOpenActivity}
        className="w-full p-3.5 rounded-2xl seer-glass hover:scale-[1.01] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
      >
        <Clock className="w-4 h-4 text-[var(--muted)]" />
        <span className="font-medium">View Transaction History {activitiesCount > 0 ? `(${activitiesCount})` : ""}</span>
      </button>
    </aside>
  );
};
