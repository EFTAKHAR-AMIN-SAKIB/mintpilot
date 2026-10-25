"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, ShieldCheck, AlertCircle, ArrowRight, X } from "lucide-react";
import { NFTCollectionCandidate } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getExplorerAddressUrl } from "@/lib/network/config";

interface VerificationCardProps {
  collection: NFTCollectionCandidate;
  onConfirmDetails: () => void;
  onRejectDetails: () => void;
  isLoading?: boolean;
  isPreviewed?: boolean;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  collection,
  onConfirmDetails,
  onRejectDetails,
  isLoading,
  isPreviewed,
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(collection.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = getExplorerAddressUrl(collection.contractAddress, collection.chainId);

  return (
    <Card variant="surface" className="p-5 sm:p-6 space-y-5 max-w-xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-apple-blue uppercase block mb-1">
            Collection Resolution Found
          </span>
          <h3 className="text-xl font-semibold tracking-tight text-apple-text dark:text-apple-darkText">
            {collection.collectionName}
          </h3>
          <p className="text-xs text-apple-secondary dark:text-apple-darkSecondary mt-0.5">
            Verified candidate on {collection.chain}
          </p>
        </div>
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt={collection.collectionName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-apple-sm object-cover border border-apple-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-apple-subtle dark:bg-apple-darkSubtle flex items-center justify-center text-apple-blue">
            <ShieldCheck className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Details Table */}
      <div className="rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Contract Address</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-medium text-apple-text dark:text-apple-darkText">
              {collection.contractAddress.slice(0, 8)}...{collection.contractAddress.slice(-6)}
            </span>
            <button
              onClick={copyAddress}
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
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Contract Verification</span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>On-Chain Bytecode Confirmed</span>
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Mint Price</span>
          <div className="text-right">
            <span className="font-semibold text-apple-text dark:text-apple-darkText">
              {collection.mintPrice} BNB
            </span>
            <span className="text-[10px] text-apple-secondary dark:text-apple-darkSecondary block">
              Source: {collection.mintPriceSource.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-apple-border/40 dark:border-apple-darkBorder/40">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Token Standard</span>
          <span className="font-medium text-apple-text dark:text-apple-darkText">
            {collection.tokenStandard}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-apple-secondary dark:text-apple-darkSecondary">Mint Method</span>
          <span className="font-mono text-apple-text dark:text-apple-darkText">
            {collection.supportedMintFunction?.signature || "mint(address)"}
          </span>
        </div>
      </div>

      {/* Warnings if present */}
      {collection.warnings.length > 0 && (
        <div className="p-3 rounded-apple-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Resolution Notes</span>
          </div>
          {collection.warnings.map((warn, i) => (
            <p key={i} className="text-[11px] leading-relaxed">
              {warn}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRejectDetails}
          disabled={isLoading}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Not the right collection
        </Button>
        <Button
          variant={isPreviewed ? "secondary" : "primary"}
          size="md"
          onClick={onConfirmDetails}
          isLoading={isLoading}
          disabled={isPreviewed || isLoading}
        >
          {isPreviewed ? "Details Reviewed ✓" : "Review mint details"}
          {!isPreviewed && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </Card>
  );
};
