"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { WelcomeScreen } from "@/components/conversation/WelcomeScreen";
import { Composer } from "@/components/conversation/Composer";
import { WalletModal } from "@/components/wallet/WalletModal";
import { VerificationCard } from "@/components/nft/VerificationCard";
import { TransactionPreviewCard } from "@/components/nft/TransactionPreviewCard";
import { ExecutionStatusCard } from "@/components/nft/ExecutionStatusCard";
import { ActivityDrawer } from "@/components/history/ActivityDrawer";
import {
  WalletSessionInfo,
  ConversationMessage,
  ParsedIntent,
  NFTCollectionCandidate,
  TransactionCandidate,
  ExecutionResult,
  ActivityItem,
} from "@/types";

export default function MintPilotPage() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Wallet state
  const [wallet, setWallet] = useState<WalletSessionInfo>({
    status: "UNCONNECTED",
  });
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  // Conversation & Flow state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [activeVerification, setActiveVerification] = useState<NFTCollectionCandidate | null>(null);
  const [activePreview, setActivePreview] = useState<TransactionCandidate | null>(null);
  const [activeExecution, setActiveExecution] = useState<ExecutionResult | null>(null);

  // Activity Drawer state
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize theme from system or storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("mintpilot_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("mintpilot_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // Check initial wallet session
  const fetchWalletStatus = async () => {
    try {
      const res = await fetch("/api/wallet/session");
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setWallet(data.wallet);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchWalletStatus();
  }, []);

  // Poll for QR pairing when in PAIRING state
  useEffect(() => {
    if (wallet.status !== "PAIRING" || !wallet.pairingData?.qrCodeId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/wallet/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCodeId: wallet.pairingData?.qrCodeId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "CONNECTED" && data.wallet) {
            setWallet(data.wallet);
            setIsWalletModalOpen(false);
            clearInterval(interval);
            fetchActivities();
          }
        }
      } catch {
        // ignore polling network glitch
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [wallet.status, wallet.pairingData]);

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/transactions/activities");
      if (res.ok) {
        const data = await res.json();
        if (data.activities) {
          setActivities(data.activities);
        }
      }
    } catch {
      // ignore
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeVerification, activePreview, activeExecution]);

  // Start Pairing
  const handleStartPairing = async () => {
    setIsWalletLoading(true);
    try {
      const res = await fetch("/api/wallet/session", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.pairing) {
          setWallet((prev) => ({
            ...prev,
            status: "PAIRING",
            isDevelopmentProvider: data.isDevelopmentMode,
            pairingData: data.pairing,
          }));
        }
      }
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    setIsWalletLoading(true);
    try {
      await fetch("/api/wallet/disconnect", { method: "POST" });
      setWallet({ status: "UNCONNECTED" });
      setIsWalletModalOpen(false);
      fetchActivities();
    } finally {
      setIsWalletLoading(false);
    }
  };

  // User sends prompt
  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim()) return;

    // 1. Add User Message
    const userMsg: ConversationMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: promptText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setProcessingStatus("Analyzing request with Gemini...");

    // Natural language confirmation check: if preview is pending and user confirms verbally
    if (activePreview && (promptText.toLowerCase().includes("yes") || promptText.toLowerCase().includes("confirm") || promptText.toLowerCase().includes("mint"))) {
      handleConfirmExecution();
      return;
    }

    try {
      // 2. Parse Intent via Gemini / API
      const parseRes = await fetch("/api/intent/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!parseRes.ok) {
        throw new Error("Failed to interpret your request.");
      }

      const { intent }: { intent: ParsedIntent } = await parseRes.json();

      // Handle informational query
      if (intent.intentType === "informational") {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            sender: "assistant",
            text: "MintPilot uses Google Gemini to understand your intent and Binance Agentic Wallet to prepare secure previews on BNB Smart Chain. Here's how it works:\n\n1. You describe what you want to mint.\n2. MintPilot resolves the verified collection, contract address, and mint price.\n3. Binance Agentic Wallet generates a real transaction preview.\n4. You review every fee and risk before explicitly approving execution.",
            timestamp: Date.now(),
            stage: "idle",
          },
        ]);
        setIsProcessing(false);
        fetchActivities();
        return;
      }

      // Handle clarification query
      if (intent.intentType === "clarification_needed" || !intent.requiresResolution) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ast-${Date.now()}`,
            sender: "assistant",
            text: intent.clarificationQuestion || "Which collection or website would you like to mint from? You can paste an official URL or contract address.",
            timestamp: Date.now(),
            stage: "idle",
          },
        ]);
        setIsProcessing(false);
        fetchActivities();
        return;
      }

      // Handle Mint NFT: Resolve Collection
      setProcessingStatus(`Inspecting ${intent.sourceUrl || intent.collectionName || "collection"} and verifying BNB Smart Chain...`);

      const resolveRes = await fetch("/api/nft/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: intent.sourceUrl,
          collectionName: intent.collectionName,
          contractAddress: intent.contractAddress,
          maximumMintPrice: intent.maximumMintPrice,
          chainId: intent.chain === "bsc_testnet" ? 97 : 56,
        }),
      });

      if (!resolveRes.ok) {
        throw new Error("Could not resolve NFT collection details.");
      }

      const { candidate }: { candidate: NFTCollectionCandidate } = await resolveRes.json();
      setActiveVerification(candidate);

      setMessages((prev) => [
        ...prev,
        {
          id: `ast-verified-${Date.now()}`,
          sender: "assistant",
          text: `I found a possible match for ${candidate.collectionName}. Take a moment to verify the collection and contract before continuing.`,
          timestamp: Date.now(),
          stage: "verification",
          verificationData: candidate,
        },
      ]);

      fetchActivities();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          sender: "assistant",
          text: `I ran into an issue: ${msg}. Please try again or provide a direct contract address.`,
          timestamp: Date.now(),
          stage: "failed",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // User accepts collection verification -> create preview
  const handleProceedToPreview = async (candidate: NFTCollectionCandidate) => {
    // Check if wallet is connected
    if (wallet.status !== "CONNECTED" || !wallet.address) {
      setIsWalletModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Generating preview via Binance Agentic Wallet...");
    try {
      const res = await fetch("/api/transactions/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: candidate,
          recipientAddress: wallet.address,
          fromAddress: wallet.address,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate wallet preview.");
      }

      const { preview }: { preview: TransactionCandidate } = await res.json();
      setActivePreview(preview);

      setMessages((prev) => [
        ...prev,
        {
          id: `ast-prev-${Date.now()}`,
          sender: "assistant",
          text: "Here’s what the wallet preview returned. Review the costs and transaction details before approving.",
          timestamp: Date.now(),
          stage: "preview",
          previewData: preview,
        },
      ]);

      fetchActivities();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-prev-err-${Date.now()}`,
          sender: "assistant",
          text: `Preview error: ${msg}.`,
          timestamp: Date.now(),
          stage: "failed",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // User confirms execution
  const handleConfirmExecution = async () => {
    if (!activePreview || !activePreview.walletRequestId) return;

    setIsProcessing(true);
    setProcessingStatus("Submitting previewed request to Binance Agentic Wallet...");
    const targetPreview = activePreview;

    try {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-executing-${Date.now()}`,
          sender: "assistant",
          text: "Your transaction has been submitted. I’m checking for network confirmation.",
          timestamp: Date.now(),
          stage: "executing",
        },
      ]);

      const res = await fetch("/api/transactions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewId: targetPreview.previewId,
          walletRequestId: targetPreview.walletRequestId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Execution failed.");
      }

      const { execution }: { execution: ExecutionResult } = await res.json();
      setActiveExecution(execution);
      setActivePreview(null);
      setActiveVerification(null);

      setMessages((prev) => [
        ...prev,
        {
          id: `ast-exec-done-${Date.now()}`,
          sender: "assistant",
          text:
            execution.status === "CONFIRMED" || execution.status === "BROADCASTED"
              ? "Your mint was confirmed. You can view the transaction on the block explorer."
              : "The transaction was submitted and is pending confirmation in your Binance mobile app.",
          timestamp: Date.now(),
          stage: "success",
          executionData: execution,
        },
      ]);

      fetchActivities();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-exec-failed-${Date.now()}`,
          sender: "assistant",
          text: `The transaction did not complete successfully: ${msg}`,
          timestamp: Date.now(),
          stage: "failed",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset conversation to mint another
  const handleReset = () => {
    setActiveExecution(null);
    setActivePreview(null);
    setActiveVerification(null);
    setMessages([]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header
        wallet={wallet}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onToggleActivityDrawer={() => {
          setIsActivityOpen((prev) => !prev);
          fetchActivities();
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Conversation Workspace */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <WelcomeScreen onSelectSuggestion={handleSendMessage} />
          </div>
        ) : (
          <div className="flex-1 space-y-6 pb-24">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                } space-y-2 animate-fade-in`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-apple-blue text-white rounded-br-sm shadow-sm"
                      : "bg-apple-surface dark:bg-apple-darkSurface text-apple-text dark:text-apple-darkText border border-apple-border dark:border-apple-darkBorder rounded-bl-sm shadow-apple"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Inline Card: Verification */}
                {msg.verificationData && activeVerification && (
                  <div className="w-full pt-2">
                    <VerificationCard
                      collection={msg.verificationData}
                      onConfirmDetails={() => handleProceedToPreview(msg.verificationData!)}
                      onRejectDetails={() => {
                        setActiveVerification(null);
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `ast-cancel-${Date.now()}`,
                            sender: "assistant",
                            text: "No problem. Which collection would you like to mint from instead?",
                            timestamp: Date.now(),
                          },
                        ]);
                      }}
                      isLoading={isProcessing}
                    />
                  </div>
                )}

                {/* Inline Card: Preview */}
                {msg.previewData && activePreview && (
                  <div className="w-full pt-2">
                    <TransactionPreviewCard
                      preview={msg.previewData}
                      onConfirm={handleConfirmExecution}
                      onCancel={() => {
                        setActivePreview(null);
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `ast-cancel-prev-${Date.now()}`,
                            sender: "assistant",
                            text: "Transaction cancelled. Your wallet was not charged. What would you like to do next?",
                            timestamp: Date.now(),
                          },
                        ]);
                      }}
                      isLoading={isProcessing}
                      isDevelopmentMode={wallet.isDevelopmentProvider}
                    />
                  </div>
                )}

                {/* Inline Card: Execution Status */}
                {msg.executionData && (
                  <div className="w-full pt-2">
                    <ExecutionStatusCard
                      execution={msg.executionData}
                      preview={activePreview || undefined}
                      onReset={handleReset}
                    />
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-apple-surface dark:bg-apple-darkSurface border border-apple-border dark:border-apple-darkBorder text-xs text-apple-secondary dark:text-apple-darkSecondary animate-fade-in shadow-apple w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-apple-blue"></span>
                </span>
                <span>{processingStatus || "Analyzing request..."}</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </main>

      {/* Sticky Bottom Composer */}
      <footer className="sticky bottom-0 z-30 bg-gradient-to-t from-apple-bg via-apple-bg/95 to-transparent dark:from-apple-darkBg dark:via-apple-darkBg/95 pt-4">
        <Composer
          onSendMessage={handleSendMessage}
          isLoading={isProcessing}
          disabled={isProcessing}
          placeholder="What would you like to do on-chain? (e.g. Mint 1 NFT from Pixel Garden for 0.01 BNB)"
        />
      </footer>

      {/* Wallet Pairing & Session Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        onStartPairing={handleStartPairing}
        onDisconnect={handleDisconnect}
        isLoading={isWalletLoading}
      />

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={activities}
      />
    </div>
  );
}
