"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Plus,
  ShieldCheck,
  Sword,
  Heart,
  Zap,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { OwnedNFT, WalletSessionInfo } from "@/types";
import { NFTDetailModal } from "./NFTDetailModal";
import { getExplorerAddressUrl } from "@/lib/network/config";

interface NFTVaultStageProps {
  nfts: OwnedNFT[];
  wallet: WalletSessionInfo;
  isLoading: boolean;
  onRefresh: () => void;
  onStartMint: (promptText?: string) => void;
}

export const NFTVaultStage: React.FC<NFTVaultStageProps> = ({
  nfts,
  wallet,
  isLoading,
  onRefresh,
  onStartMint,
}) => {
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (nft: OwnedNFT) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const isConnected = wallet.status === "CONNECTED";

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7d33ff] dark:text-purple-300 bg-purple-500/15 border border-purple-500/25 px-2.5 py-0.5 rounded-full">
              Keyless MPC Portfolio
            </span>
            <span className="text-xs text-[var(--muted)] font-mono">
              BNB Smart Chain
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <span>Agentic Wallet Vault</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--capsule)] border border-[var(--border)] text-[var(--ink)] font-semibold">
              {nfts.length} {nfts.length === 1 ? "Item" : "Items"}
            </span>
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Verified BEP-721 collectibles minted and stored in your Binance Agentic Wallet
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl seer-glass text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-all shadow-sm"
            title="Refresh on-chain inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#7d33ff]" : ""}`} />
            <span>{isLoading ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => onStartMint("Help me mint an NFT")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-2xl seer-btn-violet text-xs font-semibold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Mint NFT</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {nfts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 space-y-4 rounded-3xl seer-glass border border-dashed border-[var(--border)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--capsule)] flex items-center justify-center text-[var(--muted)]">
            <Layers className="w-7 h-7" />
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-[var(--ink)]">No NFTs in Vault yet</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {isConnected
                ? "Your Binance Agentic Wallet doesn't hold any verified collectibles on BNB Smart Chain yet."
                : "Connect your Binance Agentic Wallet to view your on-chain NFT portfolio."}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onStartMint("Help me mint an NFT")}
              className="px-5 py-2.5 rounded-full seer-btn-violet text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mint an NFT</span>
            </button>
            <button
              onClick={() => onStartMint("What are popular NFT collections on BNB Chain?")}
              className="px-4 py-2.5 rounded-full bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-[var(--ink)] text-xs font-medium border border-[var(--border)] transition-all"
            >
              Explore Collections
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nfts.map((nft) => {
            const combatPower = nft.derived?.combatPower || nft.stats?.combatPower;
            const hp = nft.derived?.hp || nft.stats?.hp;
            const miningWeight = nft.derived?.miningWeight;

            return (
              <div
                key={`${nft.contractAddress}-${nft.tokenId}`}
                className="group relative rounded-3xl seer-glass overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] flex flex-col"
              >
                {/* Media Container */}
                <div
                  onClick={() => handleOpenDetail(nft)}
                  className="relative w-full aspect-square bg-gradient-to-tr from-purple-950/40 via-white/[0.02] to-indigo-950/40 overflow-hidden cursor-pointer"
                >
                  {nft.imageUrl ? (
                    <Image
                      src={nft.imageUrl}
                      alt={nft.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  )}

                  {/* Top Floating Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                      #{nft.tokenId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-[9px] font-semibold text-black uppercase tracking-wider">
                      BEP-721
                    </span>
                  </div>

                  {/* Hover Overlay Pill */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full seer-btn-violet text-xs font-semibold shadow-xl flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect On-Chain</span>
                    </span>
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-0.5">
                      <span className="truncate">{nft.collectionName}</span>
                      <span className="font-mono text-[10px] shrink-0">BNB 56</span>
                    </div>

                    <h3
                      onClick={() => handleOpenDetail(nft)}
                      className="text-base font-bold text-[var(--ink)] tracking-tight hover:text-[#7d33ff] transition-colors cursor-pointer truncate"
                    >
                      {nft.name}
                    </h3>

                    {/* Quick Stats Badges (if available) */}
                    {(combatPower || hp || miningWeight) && (
                      <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                        {combatPower && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-500 dark:text-amber-300">
                            <Sword className="w-2.5 h-2.5" />
                            <span>CP {String(combatPower)}</span>
                          </span>
                        )}
                        {hp && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-mono text-red-500 dark:text-red-300">
                            <Heart className="w-2.5 h-2.5" />
                            <span>HP {String(hp)}</span>
                          </span>
                        )}
                        {miningWeight && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-500 dark:text-blue-300">
                            <Zap className="w-2.5 h-2.5" />
                            <span>{String(miningWeight)} W</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                    <button
                      onClick={() => handleOpenDetail(nft)}
                      className="text-xs font-semibold text-[#7d33ff] hover:underline transition-colors flex items-center gap-1"
                    >
                      <span>Details & Traits</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    <a
                      href={getExplorerAddressUrl(nft.contractAddress, 56)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--muted)] hover:text-[#7d33ff] transition-colors flex items-center gap-1"
                      title="View on BscScan"
                    >
                      <span>BscScan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <NFTDetailModal
        nft={selectedNft}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNft(null);
        }}
      />
    </div>
  );
};
