"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Sword,
  Shield,
  Zap,
  Heart,
  Layers,
  Award,
} from "lucide-react";
import { OwnedNFT } from "@/types";
import { getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/network/config";

interface NFTDetailModalProps {
  nft: OwnedNFT | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({
  nft,
  isOpen,
  onClose,
}) => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedOwner, setCopiedOwner] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(false);

  if (!isOpen || !nft) return null;

  const explorerAddressUrl = getExplorerAddressUrl(nft.contractAddress, nft.chainId || 56);
  const explorerTxUrl = nft.txHash ? getExplorerTxUrl(nft.txHash, nft.chainId || 56) : null;

  const copyText = (text: string, type: "contract" | "owner" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "contract") {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else if (type === "owner") {
      setCopiedOwner(true);
      setTimeout(() => setCopiedOwner(false), 2000);
    } else {
      setCopiedTokenId(true);
      setTimeout(() => setCopiedTokenId(false), 2000);
    }
  };

  const combatPower = nft.derived?.combatPower || nft.stats?.combatPower || "160";
  const hp = nft.derived?.hp || nft.stats?.hp || "200";
  const attack = nft.derived?.attack || "30";
  const defense = nft.derived?.defense || "10";
  const miningWeight = nft.derived?.miningWeight || "100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl seer-glass rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/15 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Agentic Wallet Vault Asset
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Hero Media & Title Section */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Artwork */}
            <div className="relative w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-950/30 to-indigo-950/30 border border-[var(--border)] shrink-0 shadow-lg group">
              {nft.imageUrl ? (
                <Image
                  src={nft.imageUrl}
                  alt={nft.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <Sparkles className="w-12 h-12" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/10 font-bold">
                #{nft.tokenId}
              </div>
            </div>

            {/* Title & Core Details */}
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25 font-medium font-mono">
                  {nft.tokenStandard}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-medium">
                  Verified On-Chain
                </span>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  {nft.chain || "BNB Smart Chain"}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight break-words">
                {nft.name}
              </h2>

              <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-3">
                {nft.description || "Minted via Binance Agentic Wallet on BNB Smart Chain."}
              </p>

              {/* Combat Power & Primary Stats Pill */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--muted)] mb-0.5">
                    <Sword className="w-3 h-3 text-amber-500" />
                    <span>Combat Power</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-[var(--ink)]">{combatPower}</span>
                </div>

                <div className="p-2 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--muted)] mb-0.5">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>Health (HP)</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-[var(--ink)]">{hp}</span>
                </div>

                <div className="p-2 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--muted)] mb-0.5">
                    <Zap className="w-3 h-3 text-[#7d33ff]" />
                    <span>Mining Weight</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-[var(--ink)]">{miningWeight}</span>
                </div>
              </div>
            </div>
          </div>

          {/* On-Chain Provenance Table */}
          <div className="rounded-2xl bg-[var(--capsule)] border border-[var(--border)] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">Contract Address</span>
              <div className="flex items-center gap-1.5 font-mono text-[var(--ink)]">
                <span>
                  {nft.contractAddress.slice(0, 8)}...{nft.contractAddress.slice(-6)}
                </span>
                <button
                  onClick={() => copyText(nft.contractAddress, "contract")}
                  className="p-1 hover:text-[#7d33ff] transition-colors"
                  title="Copy contract address"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={explorerAddressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:text-[#7d33ff] transition-colors"
                  title="View on BscScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">Owner Wallet</span>
              <div className="flex items-center gap-1.5 font-mono text-[var(--ink)]">
                <span>
                  {nft.ownerAddress.slice(0, 8)}...{nft.ownerAddress.slice(-6)}
                </span>
                <button
                  onClick={() => copyText(nft.ownerAddress, "owner")}
                  className="p-1 hover:text-[#7d33ff] transition-colors"
                  title="Copy owner address"
                >
                  {copiedOwner ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">Token ID</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-[#7d33ff]">
                <span>#{nft.tokenId}</span>
                <button
                  onClick={() => copyText(nft.tokenId, "token")}
                  className="p-1 hover:text-[#7d33ff] transition-colors"
                  title="Copy token ID"
                >
                  {copiedTokenId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {nft.txHash && (
              <div className="flex items-center justify-between py-1">
                <span className="text-[var(--muted)]">Mint Transaction</span>
                <div className="flex items-center gap-1.5 font-mono text-[var(--ink)]">
                  <span>
                    {nft.txHash.slice(0, 8)}...{nft.txHash.slice(-6)}
                  </span>
                  {explorerTxUrl && (
                    <a
                      href={explorerTxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-[#7d33ff] transition-colors"
                      title="View transaction on BscScan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attributes & Traits Section */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink)] tracking-tight flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#7d33ff]" />
                  <span>On-Chain Attributes ({nft.attributes.length})</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {nft.attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)] space-y-0.5 text-left"
                  >
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block font-medium">
                      {attr.trait_type}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink)] font-mono break-all line-clamp-1">
                      {String(attr.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--capsule)]">
          <a
            href={explorerAddressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#7d33ff] hover:underline font-medium transition-colors"
          >
            <span>View Contract on BscScan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full seer-btn-violet font-semibold text-xs transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
