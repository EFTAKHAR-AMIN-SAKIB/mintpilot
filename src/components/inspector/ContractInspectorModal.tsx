"use client";

import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ClipboardPaste,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { NFTCollectionCandidate } from "@/types";
import { getExplorerAddressUrl } from "@/lib/network/config";

interface ContractInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMintPrompt: (prompt: string) => void;
}

export const ContractInspectorModal: React.FC<ContractInspectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMintPrompt,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NFTCollectionCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleTargets = [
    {
      label: "AIVY Robot (Verified BEP-721)",
      val: "0x77cCE940d1Fe4808aB6cf8484d45d8B51139E7D6",
    },
    {
      label: "PancakeSquad (PancakeSwap)",
      val: "0x0a8901b0E25DEb55A87524f0cC164E9b3997DE54",
    },
    {
      label: "AIVY Arena Website",
      val: "https://aivy.me/",
    },
  ];

  const handleInspect = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/nft/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: q.startsWith("0x") ? q : undefined,
          url: q.startsWith("http") ? q : undefined,
          collectionName: !q.startsWith("0x") && !q.startsWith("http") ? q : undefined,
          chainId: 56,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.collection) {
        throw new Error(data.error || "Could not resolve contract bytecode on BNB Smart Chain.");
      }

      setResult(data.collection);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuery(text.trim());
        handleInspect(text.trim());
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleMintAction = () => {
    if (!result) return;
    onClose();
    if (result.sourceUrl) {
      onSelectMintPrompt(`mint 1 NFT from ${result.sourceUrl}`);
    } else {
      onSelectMintPrompt(`Help me mint from contract ${result.contractAddress}`);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="On-Chain Contract Inspector"
      description="Inspect any smart contract or NFT collection on BNB Smart Chain before interacting."
    >
      <div className="space-y-4">
        {/* Search input bar */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste 0x... contract address or collection URL"
              onKeyDown={(e) => e.key === "Enter" && handleInspect()}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--capsule)] border border-[var(--border)] text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#7d33ff] font-mono transition-colors"
            />
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              title="Paste from clipboard"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleInspect()}
            disabled={!query.trim() || isLoading}
            className="seer-btn-violet px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Inspecting..." : "Inspect"}
          </button>
        </div>

        {/* Quick sample chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-[var(--muted)] font-medium">Quick Inspect:</span>
          {sampleTargets.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item.val);
                handleInspect(item.val);
              }}
              className="text-[10px] px-2.5 py-1 rounded-xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)] transition-colors font-mono"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Inspection Blocked</p>
              <p className="text-rose-600 dark:text-rose-200/90 leading-relaxed text-[11px]">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result View */}
        {result && (
          <div className="p-5 rounded-2xl seer-glass space-y-3.5 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--ink)]">
                    {result.collectionName}
                  </h4>
                  {result.isBytecodeContract && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <CheckCircle2 className="w-3 h-3" />
                      Smart Contract
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 font-mono">
                  {result.contractAddress}
                </p>
              </div>

              {result.contractAddress && (
                <a
                  href={getExplorerAddressUrl(result.contractAddress, 56)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-[var(--muted)] hover:text-[#7d33ff] transition-colors shrink-0"
                  title="View on BscScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Contract Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Token Standard</span>
                <span className="font-semibold text-[var(--ink)] mt-0.5 block">{result.tokenStandard || "BEP-721"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Mint Function</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate block mt-0.5">
                  {result.supportedMintFunction ? (result.supportedMintFunction.signature || `${result.supportedMintFunction.name}()`) : "mint()"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Network</span>
                <span className="font-medium text-[var(--ink)] mt-0.5 block">BNB Smart Chain (56)</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--capsule)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--muted)] block">Mint Price</span>
                <span className="font-mono text-[var(--ink)] font-medium mt-0.5 block">
                  {result.mintPrice && result.mintPrice !== "0" ? `${result.mintPrice} BNB` : "0 BNB (Free Mint)"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-xs font-medium text-[var(--ink)] border border-[var(--border)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleMintAction}
                className="seer-btn-violet px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <span>Mint in Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};