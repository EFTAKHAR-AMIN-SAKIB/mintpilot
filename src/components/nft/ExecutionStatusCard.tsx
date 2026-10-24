"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, ExternalLink, RefreshCw, Copy, Check, Sparkles } from "lucide-react";
import { ExecutionResult, TransactionCandidate } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ExecutionStatusCardProps {
  execution: ExecutionResult;
  preview?: TransactionCandidate;
  onReset: () => void;
}

export const ExecutionStatusCard: React.FC<ExecutionStatusCardProps> = ({
  execution,
  preview,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    if (execution.txHash) {
      navigator.clipboard.writeText(execution.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isConfirmed = execution.status === "CONFIRMED";
  const isBroadcasted = execution.status === "BROADCASTED";
  const isPendingApp = execution.status === "PENDING_CONFIRMATION";
  const isFailed = execution.status === "FAILED";

  return (
    <Card variant="surface" className="p-5 sm:p-6 space-y-5 max-w-xl mx-auto shadow-apple-lg animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Badge
            variant={isConfirmed ? "success" : isBroadcasted ? "blue" : isFailed ? "danger" : "warning"}
          >
            {isConfirmed
              ? "Confirmed on BNB Chain"
              : isBroadcasted
              ? "Transaction Broadcasted"
              : isPendingApp
              ? "Action Required in Binance App"
              : "Transaction Failed"}
          </Badge>
          <h3 className="text-xl font-semibold tracking-tight text-apple-text dark:text-apple-darkText pt-1">
            {isConfirmed
              ? "Your mint transaction was confirmed."
              : isBroadcasted
              ? "Your mint is being mined."
              : isPendingApp
              ? "Confirm prompt on your phone"
              : "Mint could not complete"}
          </h3>
        </div>

        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isConfirmed
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              : isFailed
              ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              : "bg-blue-50 text-apple-blue dark:bg-blue-950/40 dark:text-blue-400"
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : isFailed ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <RefreshCw className="w-5 h-5 animate-spin" />
          )}
        </div>
      </div>

      {/* Details Box */}
      <div className="rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle p-4 space-y-3 text-xs">
        {preview && (
          <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
            <span className="text-apple-secondary dark:text-apple-darkSecondary">Collection</span>
            <span className="font-semibold text-apple-text dark:text-apple-darkText">
              {preview.collectionName} ({preview.quantity} {preview.quantity > 1 ? "NFTs" : "NFT"})
            </span>
          </div>
        )}

        {execution.txHash && (
          <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
            <span className="text-apple-secondary dark:text-apple-darkSecondary">Transaction Hash</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-apple-text dark:text-apple-darkText">
                {execution.txHash.slice(0, 10)}...{execution.txHash.slice(-8)}
              </span>
              <button
                onClick={copyHash}
                className="p-1 rounded text-apple-secondary hover:text-apple-text transition-colors"
                title="Copy transaction hash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {execution.tokenId && (
          <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
            <span className="text-apple-secondary dark:text-apple-darkSecondary">Minted Token ID</span>
            <span className="font-mono font-bold text-apple-blue">
              #{execution.tokenId}
            </span>
          </div>
        )}

        {execution.blockNumber && (
          <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
            <span className="text-apple-secondary dark:text-apple-darkSecondary">Block Number</span>
            <span className="font-mono text-apple-text dark:text-apple-darkText">
              #{execution.blockNumber}
            </span>
          </div>
        )}

        {execution.errorMessage && (
          <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
            <span className="font-semibold block">Error details:</span>
            <span>{execution.errorMessage}</span>
          </div>
        )}
      </div>

      {isPendingApp && (
        <div className="p-3 rounded-apple-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300">
          Please check your Binance mobile app to authorize the transaction signing prompt.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-end pt-1">
        {execution.explorerUrl && (
          <a
            href={execution.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-sm font-medium rounded-full border border-apple-border text-apple-text hover:bg-apple-subtle transition-all"
          >
            <span>View on BscScan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <Button variant="primary" size="md" onClick={onReset}>
          Mint another NFT
        </Button>
      </div>
    </Card>
  );
};
