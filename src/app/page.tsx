"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { LivingAgentLogo } from "@/components/brand/LivingAgentLogo";
import { AgenticDeck } from "@/components/layout/AgenticDeck";
import { TopFloatingNav } from "@/components/layout/TopFloatingNav";
import { MintCanvasStage } from "@/components/canvas/MintCanvasStage";
import { ComposerPill } from "@/components/conversation/ComposerPill";
import { WelcomeScreen } from "@/components/conversation/WelcomeScreen";
import { WalletModal } from "@/components/wallet/WalletModal";
import { VerificationCard } from "@/components/nft/VerificationCard";
import { TransactionPreviewCard } from "@/components/nft/TransactionPreviewCard";
import { ExecutionStatusCard } from "@/components/nft/ExecutionStatusCard";
import { ActivityDrawer } from "@/components/history/ActivityDrawer";
import { NFTVaultStage } from "@/components/vault/NFTVaultStage";
import { ContractInspectorModal } from "@/components/inspector/ContractInspectorModal";
import { Compass, Sparkles, Bot, RotateCcw } from "lucide-react";
import {
  WalletSessionInfo,
  ConversationMessage,
  ParsedIntent,
  NFTCollectionCandidate,
  TransactionCandidate,
  ExecutionResult,
  ActivityItem,
  OwnedNFT,
} from "@/types";

/**
 * Enhanced assistant message renderer that transforms numbered points into executive step pills
 */
const ChatMessageContent: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-[var(--ink)]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Numbered list items like "1. ", "2. "
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 my-1.5 p-2.5 sm:p-3 rounded-2xl bg-[var(--capsule)] border border-[var(--border)]"
            >
              <span className="w-5 h-5 rounded-full bg-[#7d33ff]/15 text-[#7d33ff] dark:text-purple-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#7d33ff]/20">
                {numMatch[1]}
              </span>
              <span className="text-[var(--ink)] flex-1 text-xs sm:text-sm leading-relaxed">
                {numMatch[2]}
              </span>
            </div>
          );
        }

        // Bullet point items like "- ", "• "
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7d33ff] mt-2 shrink-0" />
              <span className="text-[var(--ink)] text-xs sm:text-sm leading-relaxed">
                {trimmed.substring(2)}
              </span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

export default function MintPilotPage() {
  // Theme & Navigation state
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<"chat" | "vault" | "activity">("chat");
  const [isMobileDeckOpen, setIsMobileDeckOpen] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // Agentic Wallet Name state
  const [walletName, setWalletName] = useState<string>("Binance Agentic MPC #1");

  // Wallet & NFT Portfolio state
  const [wallet, setWallet] = useState<WalletSessionInfo>({
    status: "UNCONNECTED",
  });
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [isNftsLoading, setIsNftsLoading] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

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
  const [sessionId, setSessionId] = useState<string>("default-session");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize session ID from localStorage for consistent server caching
  useEffect(() => {
    let sid = localStorage.getItem("mintpilot_session_id");
    if (!sid) {
      sid = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("mintpilot_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      "x-mintpilot-session": sessionId,
      ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
  };

  // Initialize theme from system or storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("mintpilot_theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("mintpilot_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Initialize and persist Agentic Wallet Name
  useEffect(() => {
    const savedName = localStorage.getItem("mintpilot_wallet_name");
    if (savedName) {
      setWalletName(savedName);
      setWallet((prev) => ({ ...prev, walletName: savedName }));
    } else {
      setWallet((prev) => ({ ...prev, walletName: "Binance Agentic MPC #1" }));
    }
  }, []);

  const handleUpdateWalletName = (newName: string) => {
    setWalletName(newName);
    localStorage.setItem("mintpilot_wallet_name", newName);
    setWallet((prev) => ({ ...prev, walletName: newName }));
  };

  // Check initial wallet session
  const fetchWalletStatus = async () => {
    try {
      const res = await apiFetch("/api/wallet/session");
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          const savedName = localStorage.getItem("mintpilot_wallet_name") || "Binance Agentic MPC #1";
          setWallet({
            ...data.wallet,
            walletName: savedName,
          });
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
        const res = await apiFetch("/api/wallet/poll", {
          method: "POST",
          body: JSON.stringify({ qrCodeId: wallet.pairingData?.qrCodeId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "CONNECTED" && data.wallet) {
            setWallet(data.wallet);
            setIsWalletModalOpen(false);
            clearInterval(interval);
            fetchActivities();
      fetchNFTs();
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
      const res = await apiFetch("/api/transactions/activities");
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

  // Fetch NFTs owned by the agentic wallet
  const fetchNFTs = async () => {
    setIsNftsLoading(true);
    try {
      const url = wallet.address
        ? `/api/wallet/nfts?address=${wallet.address}`
        : "/api/wallet/nfts";
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nfts)) {
          setNfts(data.nfts);
          if (wallet.address && data.nfts.length > 0) {
            localStorage.setItem(`mintpilot_nfts_${wallet.address.toLowerCase()}`, JSON.stringify(data.nfts));
          }
        }
      }
    } catch {
      // Fallback to locally cached portfolio on error
      if (wallet.address) {
        const cached = localStorage.getItem(`mintpilot_nfts_${wallet.address.toLowerCase()}`);
        if (cached) {
          try {
            setNfts(JSON.parse(cached));
          } catch {}
        }
      }
    } finally {
      setIsNftsLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.status === "CONNECTED" && wallet.address) {
      // Immediately restore from local cache to prevent UI flash on refresh
      const cached = localStorage.getItem(`mintpilot_nfts_${wallet.address.toLowerCase()}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNfts(parsed);
          }
        } catch {}
      }
      fetchNFTs();
    }
  }, [wallet.status, wallet.address]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeVerification, activePreview, activeExecution]);

  // Start Pairing
  const handleStartPairing = async () => {
    setIsWalletLoading(true);
    setWalletError(null);
    try {
      const res = await apiFetch("/api/wallet/session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.pairing) {
        setWallet((prev) => ({
          ...prev,
          status: "PAIRING",
          isDevelopmentProvider: data.isDevelopmentMode,
          pairingData: data.pairing,
        }));
      } else {
        setWalletError(data.error || "Failed to initiate pairing session. Please try again.");
      }
    } catch {
      setWalletError("Network connection error. Please try again.");
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Confirm / Complete Pairing
  const handleConfirmPairing = async () => {
    if (!wallet.pairingData?.qrCodeId) return;
    setIsWalletLoading(true);
    setWalletError(null);
    try {
      const res = await apiFetch("/api/wallet/poll", {
        method: "POST",
        body: JSON.stringify({ qrCodeId: wallet.pairingData.qrCodeId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "CONNECTED" && data.wallet) {
          setWallet(data.wallet);
          setIsWalletModalOpen(false);
          fetchActivities();
          fetchNFTs();
        } else {
          setWalletError(data.message || "Pairing in progress. Please approve on mobile or try again.");
        }
      }
    } catch {
      setWalletError("Unable to confirm pairing.");
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    setIsWalletLoading(true);
    try {
      await apiFetch("/api/wallet/disconnect", { method: "POST" });
      setWallet({ status: "UNCONNECTED" });
      setIsWalletModalOpen(false);
      fetchActivities();
      fetchNFTs();
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

    // Natural language confirmation check: only if the user explicitly says yes/confirm/go ahead without providing a new URL or parameters
    const lowerPrompt = promptText.toLowerCase().trim();
    const isExplicitConfirmation =
      (lowerPrompt === "yes" ||
        lowerPrompt === "confirm" ||
        lowerPrompt === "proceed" ||
        lowerPrompt === "go ahead" ||
        lowerPrompt === "approve" ||
        lowerPrompt === "confirm mint" ||
        lowerPrompt === "yes, go ahead" ||
        lowerPrompt === "yes go ahead") &&
      !lowerPrompt.includes("http") &&
      !lowerPrompt.includes("from");

    if (activePreview && isExplicitConfirmation) {
      handleConfirmExecution();
      return;
    }

    // A new request invalidates any previously pending preview or verification
    setActivePreview(null);
    setActiveVerification(null);

    try {
      // 2. Parse Intent via Gemini / API
      const parseRes = await apiFetch("/api/intent/parse", {
        method: "POST",
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
      fetchNFTs();
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
      fetchNFTs();
        return;
      }

      // Handle Mint NFT: Resolve Collection
      setProcessingStatus(`Inspecting ${intent.sourceUrl || intent.collectionName || "collection"} and verifying BNB Smart Chain...`);

      const resolveRes = await apiFetch("/api/nft/resolve", {
        method: "POST",
        body: JSON.stringify({
          url: intent.sourceUrl,
          collectionName: intent.collectionName,
          contractAddress: intent.contractAddress,
          maximumMintPrice: intent.maximumMintPrice,
          chainId: intent.chain === "bsc_testnet" ? 97 : 56,
        }),
      });

      if (!resolveRes.ok) {
        const errJson = await resolveRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Could not resolve NFT collection details.");
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
      fetchNFTs();
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
      const res = await apiFetch("/api/transactions/preview", {
        method: "POST",
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
      fetchNFTs();
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
      setProcessingStatus("");
    }
  };

  // User confirms execution
  const handleConfirmExecution = async (targetCandidate?: TransactionCandidate) => {
    const candidate = targetCandidate || activePreview;
    if (!candidate || !candidate.walletRequestId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-noprev-${Date.now()}`,
          sender: "assistant",
          text: "No active transaction preview found. Please review the mint details to generate a preview first.",
          timestamp: Date.now(),
          stage: "failed",
        },
      ]);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Submitting previewed request to Binance Agentic Wallet...");

    try {
      const res = await apiFetch("/api/transactions/execute", {
        method: "POST",
        body: JSON.stringify({
          previewId: candidate.previewId,
          walletRequestId: candidate.walletRequestId,
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
              ? "Your mint was broadcasted successfully on BNB Smart Chain. You can view the live transaction on the block explorer below."
              : execution.status === "PENDING_CONFIRMATION"
              ? "The transaction was submitted and is pending confirmation in your Binance mobile app."
              : "The transaction could not be completed on-chain.",
          timestamp: Date.now(),
          stage: execution.status === "FAILED" ? "failed" : "success",
          executionData: execution,
        },
      ]);

      fetchActivities();
      fetchNFTs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-exec-failed-${Date.now()}`,
          sender: "assistant",
          text: `The transaction could not be executed: ${msg}\n\nPlease click "Confirm & Mint NFT" again or generate a new preview.`,
          timestamp: Date.now(),
          stage: "failed",
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  // Reset conversation to start fresh
  const handleReset = () => {
    setActiveExecution(null);
    setActivePreview(null);
    setActiveVerification(null);
    setMessages([]);
    setActiveTab("chat");
  };

  // Keyboard shortcut: Alt+N or Cmd/Ctrl+K to start a new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === "n") || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && e.shiftKey)) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full text-[var(--ink)] overflow-hidden relative select-none font-sans">
      {/* Seer Sky: Atmospheric ambient lighting */}
      <div className="sky" aria-hidden="true">
        <i className="a" />
        <i className="b" />
        <i className="c" />
        <i className="d" />
      </div>

      {/* Left Agentic Deck (Desktop) */}
      <div className="hidden lg:flex z-10 border-r border-[var(--border)] overflow-y-auto">
        <AgenticDeck
          wallet={wallet}
          agentId={wallet.agentId || (wallet.address?.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4" ? "eftakhar.ai" : "forkmaster.ai")}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          onOpenActivity={() => setActiveTab("activity")}
          onOpenVault={() => setActiveTab("vault")}
          onSelectPrompt={handleSendMessage}
          onNewChat={handleReset}
          activitiesCount={activities.length}
          nfts={nfts}
        />
      </div>

      {/* Mobile Slide-over Drawer for Deck */}
      {isMobileDeckOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMobileDeckOpen(false)}
          />
          <div className="relative z-10 w-[340px] max-w-[88vw] seer-glass h-full overflow-y-auto border-r border-[var(--border)] shadow-2xl flex flex-col animate-fade-in">
            <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
                <LivingAgentLogo size="xs" showAura={false} />
                Agentic Wallet Deck
              </span>
              <button
                onClick={() => setIsMobileDeckOpen(false)}
                className="px-3 py-1 rounded-full bg-[var(--capsule)] hover:bg-[var(--capsule-hover)] text-xs text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)] transition-colors"
              >
                Close ✕
              </button>
            </div>
            <AgenticDeck
              wallet={wallet}
              agentId={wallet.agentId || (wallet.address?.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4" ? "eftakhar.ai" : "forkmaster.ai")}
              onOpenWalletModal={() => {
                setIsMobileDeckOpen(false);
                setIsWalletModalOpen(true);
              }}
              onOpenActivity={() => {
                setIsMobileDeckOpen(false);
                setActiveTab("activity");
              }}
              onOpenVault={() => {
                setIsMobileDeckOpen(false);
                setActiveTab("vault");
              }}
              onSelectPrompt={(p) => {
                setIsMobileDeckOpen(false);
                handleSendMessage(p);
              }}
              onNewChat={() => {
                setIsMobileDeckOpen(false);
                handleReset();
              }}
              activitiesCount={activities.length}
              nfts={nfts}
            />
          </div>
        </div>
      )}

      {/* Center-Right Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Top Floating Navigation */}
        <TopFloatingNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "vault") fetchNFTs();
            if (tab === "activity") fetchActivities();
          }}
          wallet={wallet}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          onToggleMobileDeck={() => setIsMobileDeckOpen((prev) => !prev)}
          onOpenInspectModal={() => setIsInspectModalOpen(true)}
          onNewChat={handleReset}
          nftsCount={nfts.length}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Viewport: Vault, Activity Timeline, or Chat */}
        {activeTab === "vault" ? (
          <NFTVaultStage
            nfts={nfts}
            wallet={wallet}
            isLoading={isNftsLoading}
            onRefresh={fetchNFTs}
            onStartMint={(promptText) => {
              setActiveTab("chat");
              if (promptText) handleSendMessage(promptText);
            }}
          />
        ) : activeTab === "activity" ? (
          <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight">On-Chain Activity Timeline</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Session audit trail, previews, and confirmations</p>
              </div>
              <button
                onClick={fetchActivities}
                className="px-4 py-1.5 rounded-full seer-glass text-xs text-[var(--ink)] hover:scale-105 transition-all shadow-sm"
              >
                Refresh
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-20 text-[var(--muted)] text-sm space-y-3">
                <p>No transactions or previews recorded in this session yet.</p>
                <button
                  onClick={() => setActiveTab("chat")}
                  className="px-6 py-2 rounded-full seer-btn-violet font-semibold text-xs shadow-md"
                >
                  Start a mint in Chat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="p-4 sm:p-5 seer-glass space-y-1.5 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--ink)] text-sm">{act.title}</span>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[var(--muted)] text-xs">{act.description}</p>
                    {act.explorerUrl && (
                      <a
                        href={act.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline pt-1 text-xs"
                      >
                        <span>View on BscScan</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <main className="flex-1 flex flex-col overflow-y-auto max-w-3xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-4">
            {/* Top Interactive Mint Canvas Stage (When active) */}
            {(activeVerification || activePreview) && (
              <MintCanvasStage
                collection={activeVerification}
                preview={activePreview}
                onDismiss={() => {
                  setActiveVerification(null);
                  setActivePreview(null);
                }}
                onProceedToPreview={handleProceedToPreview}
                onConfirmMint={() => handleConfirmExecution(activePreview || undefined)}
                isLoading={isProcessing}
              />
            )}

            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <WelcomeScreen onSelectSuggestion={handleSendMessage} />
              </div>
            ) : (
              <div className="flex-1 space-y-6 pb-6">
                {/* Active Session Header Bar with Quick New Chat */}
                <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[var(--capsule)] border border-[var(--border)] text-xs shadow-sm">
                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-[var(--ink)]">Active Mint Session</span>
                    <span className="text-[11px] font-mono text-[var(--muted)]">({messages.length} message{messages.length === 1 ? "" : "s"})</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full seer-glass hover:bg-[var(--capsule-hover)] text-xs text-[var(--muted)] hover:text-[#7d33ff] dark:hover:text-purple-300 border border-[var(--border)] transition-all cursor-pointer shadow-sm hover:scale-105"
                    title="Clear current session and start a new chat"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#7d33ff] dark:text-purple-400" />
                    <span className="font-semibold">New Chat</span>
                  </button>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className="w-full">
                    {msg.sender === "user" ? (
                      /* User Message Bubble */
                      <div className="flex flex-col items-end space-y-1.5 max-w-[88%] sm:max-w-[75%] ml-auto animate-fade-in">
                        <div className="flex items-center gap-1.5 pr-1 text-[11px] font-medium text-[var(--muted)]">
                          <span>You</span>
                        </div>
                        <div className="px-5 py-3 rounded-2xl seer-btn-violet rounded-tr-sm shadow-md text-sm text-white font-medium leading-relaxed">
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Message & Interactive Cards */
                      <div className="flex flex-col items-start space-y-2.5 w-full max-w-[98%] sm:max-w-[92%] mr-auto animate-fade-in">
                        <div className="flex items-center gap-2 pl-1">
                          <LivingAgentLogo size="xs" showAura={false} />
                          <span className="text-xs font-bold text-[var(--ink)] tracking-tight">MintPilot Agent</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-medium">
                            Gemini 1.5
                          </span>
                        </div>

                        <div className="p-4 sm:p-5.5 rounded-3xl seer-glass rounded-tl-sm shadow-xl space-y-2 w-full text-sm leading-relaxed border border-[var(--border)]">
                          <ChatMessageContent text={msg.text} />
                        </div>

                        {/* Inline Card: Verification */}
                        {msg.verificationData && (
                          <div className="w-full pt-2">
                            <VerificationCard
                              collection={msg.verificationData}
                              isPreviewed={Boolean(activePreview || msg.previewData || activeExecution)}
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
                        {msg.previewData && (
                          <div className="w-full pt-2">
                            <TransactionPreviewCard
                              preview={msg.previewData}
                              onConfirm={() => handleConfirmExecution(msg.previewData)}
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
                              isLoading={isProcessing && activePreview?.previewId === msg.previewData.previewId}
                              isExecuted={Boolean(activeExecution && activeExecution.previewId === msg.previewData.previewId)}
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
                              onViewVault={() => {
                                setActiveTab("vault");
                                fetchNFTs();
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2.5 px-4 py-2 seer-glass-pill text-xs text-[var(--muted)] animate-fade-in shadow-md w-fit">
                    <LivingAgentLogo size="xs" isThinking={true} showAura={true} />
                    <span className="font-medium text-[var(--ink)]">{processingStatus || "Analyzing request..."}</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
          </main>
        )}

        {/* Floating Bottom Composer (only when in chat tab) */}
        {activeTab === "chat" && (
          <footer className="sticky bottom-0 z-30 pt-1 pointer-events-none">
            <div className="pointer-events-auto">
              <ComposerPill
                onSendMessage={handleSendMessage}
                isLoading={isProcessing}
                disabled={isProcessing}
                placeholder="Message MintPilot or paste URL..."
              />
            </div>
          </footer>
        )}
      </div>

      {/* Wallet Pairing & Session Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setWalletError(null);
        }}
        wallet={wallet}
        onStartPairing={handleStartPairing}
        onConfirmPairing={handleConfirmPairing}
        onDisconnect={handleDisconnect}
        isLoading={isWalletLoading}
        error={walletError}
      />

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={activities}
      />

      {/* Contract & Collection Inspector Modal */}
      <ContractInspectorModal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        onSelectMintPrompt={(prompt) => {
          setActiveTab("chat");
          handleSendMessage(prompt);
        }}
      />
    </div>
  );
}
