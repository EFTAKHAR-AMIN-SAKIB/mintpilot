"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, ExternalLink, Copy, Check, Clock, Sparkles } from "lucide-react";
import { TransactionCandidate } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getExplorerAddressUrl } from "@/lib/network/config";

interface TransactionPreviewCardProps {
  preview: TransactionCandidate;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isDevelopmentMode?: boolean;
}

export const TransactionPreviewCard: React.FC<TransactionPreviewCardProps> = ({
  preview,
  onConfirm,
  onCancel,
  isLoading,
  isDevelopmentMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCalldata, setShowCalldata] = useState(false);

  const copyContract = () => {
    navigator.clipboard.writeText(preview.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = getExplorerAddressUrl(preview.contractAddress, preview.chainId);

  return (
    <Card variant="surface" className="p-5 sm:p-6 space-y-5 max-w-xl mx-auto border-apple-blue/30 shadow-apple-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-apple-blue uppercase">
              Binance Agentic Wallet Preview
            </span>
            <Badge variant="blue">Awaiting Confirmation</Badge>
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-apple-text dark:text-apple-darkText">
            Mint {preview.quantity} {preview.quantity > 1 ? "NFTs" : "NFT"} from {preview.collectionName}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-apple-blue flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {isDevelopmentMode && (
        <div className="p-3 rounded-apple-sm bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
          <span>
            Development Mode Preview: Real parameters encoded with viem; simulated through Binance Agentic Wallet dev adapter.
          </span>
        </div>
      )}

      {/* Main Breakdown Card */}
      <div className="rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Target Contract</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-medium text-apple-text dark:text-apple-darkText">
              {preview.contractAddress.slice(0, 8)}...{preview.contractAddress.slice(-6)}
            </span>
            <button
              onClick={copyContract}
              className="p-1 rounded text-apple-secondary hover:text-apple-text transition-colors"
              title="Copy address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-apple-secondary hover:text-apple-blue transition-colors"
              title="View on BscScan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Recipient Address</span>
          <span className="font-mono text-apple-text dark:text-apple-darkText">
            {preview.recipientAddress.slice(0, 8)}...{preview.recipientAddress.slice(-6)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Mint Method</span>
          <span className="font-mono text-apple-text dark:text-apple-darkText">
            {preview.functionSignature}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Mint Price</span>
          <span className="font-medium text-apple-text dark:text-apple-darkText">
            {preview.mintPriceBnb} BNB per NFT
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">NFT Mint Cost</span>
          <span className="font-semibold text-apple-text dark:text-apple-darkText">
            {preview.totalCostBnb} BNB
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">
            Estimated Network Fee (~{preview.estimatedGas || "95,000"} gas)
          </span>
          <span className="text-apple-text dark:text-apple-darkText">
            ~{preview.estimatedGasFeeBnb || "0.000285"} BNB
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 text-sm font-semibold">
          <span className="text-apple-text dark:text-apple-darkText">Estimated Total</span>
          <div className="text-right">
            <span className="text-apple-blue font-bold text-base">
              ~{preview.estimatedTotalBnb || preview.totalCostBnb} BNB
            </span>
            <span className="block text-[10px] text-apple-secondary font-normal">
              Subject to live network gas price
            </span>
          </div>
        </div>
      </div>

      {/* Calldata inspect toggle */}
      <div className="text-xs">
        <button
          onClick={() => setShowCalldata((prev) => !prev)}
          className="text-apple-secondary hover:text-apple-text underline decoration-dotted"
        >
          {showCalldata ? "Hide raw transaction calldata" : "View decoded calldata"}
        </button>
        {showCalldata && (
          <div className="mt-2 p-3 rounded bg-black/5 dark:bg-white/5 font-mono text-[11px] break-all space-y-1 text-apple-secondary">
            <div>
              <span className="font-semibold text-apple-text dark:text-apple-darkText">Input Calldata: </span>
              {preview.calldata}
            </div>
            <div>
              <span className="font-semibold text-apple-text dark:text-apple-darkText">Value (Wei): </span>
              {preview.totalValueWei}
            </div>
            <div>
              <span className="font-semibold text-apple-text dark:text-apple-darkText">Request ID: </span>
              {preview.walletRequestId}
            </div>
          </div>
        )}
      </div>

      {/* Warnings / Disclaimers */}
      <div className="p-3 rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle text-[11px] text-apple-secondary space-y-1">
        <p>
          You are about to mint {preview.quantity} NFT from {preview.collectionName}. Review all transaction details before proceeding.
        </p>
      </div>

      {/* Confirmation Actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
        <Button variant="outline" size="md" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onConfirm}
          isLoading={isLoading}
          className="shadow-apple"
        >
          Confirm & Mint NFT
        </Button>
      </div>
    </Card>
  );
};
