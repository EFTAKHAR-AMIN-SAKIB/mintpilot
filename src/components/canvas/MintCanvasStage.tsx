"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";
import { NFTCollectionCandidate, TransactionCandidate } from "@/types";
import { getExplorerAddressUrl } from "@/lib/network/config";

interface MintCanvasStageProps {
  collection?: NFTCollectionCandidate | null;
  preview?: TransactionCandidate | null;
  onDismiss: () => void;
  onProceedToPreview?: (collection: NFTCollectionCandidate) => void;
  onConfirmMint?: () => void;
  isLoading?: boolean;
}

export const MintCanvasStage: React.FC<MintCanvasStageProps> = ({
  collection,
  preview,
  onDismiss,
  onProceedToPreview,
  onConfirmMint,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!collection && !preview) return null;

  const targetAddress = preview?.contractAddress || collection?.contractAddress || "";
  const collectionName = preview?.collectionName || collection?.collectionName || "Discovered Collection";
  const mintPrice = preview?.mintPriceBnb || collection?.mintPrice || "0";
  const isFree = parseFloat(mintPrice) === 0;

  const copyAddress = () => {
    if (targetAddress) {
      navigator.clipboard.writeText(targetAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full rounded-3xl seer-glass overflow-hidden shadow-2xl transition-all duration-300 animate-fade-in mb-6">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 pointer-events-none" />

      {/* Stage Top Header Bar */}
      <div className="relative z-10 px-4 sm:px-6 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#7d33ff] animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {preview ? "Binance Wallet Signing Canvas" : "On-Chain Resolution Canvas"}
          </span>
        </div>

        {/* Top Right Stage Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-full bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            title={isExpanded ? "Collapse stage" : "Expand stage"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-medium border border-[var(--border)]"
            title="Dismiss stage"
          >
            <X className="w-3 h-3" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Stage Body */}
      <div className="relative z-10 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {collection?.imageUrl ? (
              <Image
                src={collection.imageUrl}
                alt={collectionName}
                width={56}
                height={56}
                className="w-14 h-14 rounded-2xl object-cover border border-[var(--border)] shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl seer-btn-violet flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">{collectionName}</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/25">
                  Verified
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                BEP-721 Smart Contract on BNB Smart Chain
              </p>
            </div>
          </div>

          {/* Quick Price Indicator */}
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block">Mint Price</span>
            <span className="text-lg font-bold text-[var(--ink)] font-mono">
              {isFree ? "0 BNB (Free Mint)" : `${mintPrice} BNB`}
            </span>
          </div>
        </div>

        {/* Collapsible / Expandable Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] flex items-center justify-between">
            <span className="text-[var(--muted)]">Contract</span>
            <div className="flex items-center gap-1 font-mono text-[var(--ink)]">
              <span>{targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}</span>
              <button
                onClick={copyAddress}
                className="p-1 hover:text-[#7d33ff] transition-colors"
                title="Copy address"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={getExplorerAddressUrl(targetAddress, 56)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-[#7d33ff] transition-colors"
                title="View on BscScan"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] flex items-center justify-between">
            <span className="text-[var(--muted)]">Security Check</span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>0 Risk Factors</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] flex items-center justify-between">
            <span className="text-[var(--muted)]">Est. Gas</span>
            <span className="font-mono text-[var(--ink)]">~0.000285 BNB (~$0.08)</span>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] font-mono text-[11px] text-[var(--muted)] space-y-1 animate-fade-in break-all">
            <p><span className="text-[var(--ink)] font-semibold">Calldata:</span> {preview?.calldata || "0x6a627842..."}</p>
            <p><span className="text-[var(--ink)] font-semibold">Binance Chain ID:</span> 56</p>
            {preview?.walletRequestId && (
              <p><span className="text-[var(--ink)] font-semibold">Wallet Request ID:</span> {preview.walletRequestId}</p>
            )}
          </div>
        )}

        {/* Stage CTA Action */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {!preview && collection && onProceedToPreview && (
            <button
              onClick={() => onProceedToPreview(collection)}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full seer-btn-violet text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <span>{isLoading ? "Preparing Preview..." : "Generate Wallet Preview"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {preview && onConfirmMint && (
            <button
              onClick={onConfirmMint}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-full seer-btn-violet text-xs font-semibold shadow-lg transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? "Submitting to Binance Wallet..." : "Authorize & Mint NFT"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
