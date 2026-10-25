import fs from "fs";
import path from "path";
import os from "os";
import {
  TransactionCandidate,
  ExecutionResult,
  ActivityItem,
  WalletSessionInfo,
  OwnedNFT,
} from "@/types";

interface ServerSessionData {
  sessionId: string;
  walletInfo: WalletSessionInfo;
  activePreview?: TransactionCandidate;
  lastExecution?: ExecutionResult;
  isExecuting?: boolean;
  activities: ActivityItem[];
  createdAt: number;
  lastActiveAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __mintpilot_session_store: Map<string, ServerSessionData> | undefined;
  // eslint-disable-next-line no-var
  var __mintpilot_preview_cache: Map<string, TransactionCandidate> | undefined;
  // eslint-disable-next-line no-var
  var __mintpilot_nft_store: Map<string, OwnedNFT[]> | undefined;
  // eslint-disable-next-line no-var
  var __mintpilot_agent_id_map: Map<string, string> | undefined;
}

const sessionStore = globalThis.__mintpilot_session_store ?? new Map<string, ServerSessionData>();
if (!globalThis.__mintpilot_session_store) {
  globalThis.__mintpilot_session_store = sessionStore;
}

const previewCache = globalThis.__mintpilot_preview_cache ?? new Map<string, TransactionCandidate>();
if (!globalThis.__mintpilot_preview_cache) {
  globalThis.__mintpilot_preview_cache = previewCache;
}

const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "mintpilot_data")
  : path.join(process.cwd(), ".data");
const NFT_STORE_FILE = path.join(dataDir, "nft_store.json");

function loadPersistedNFTs(): void {
  try {
    if (fs.existsSync(NFT_STORE_FILE)) {
      const content = fs.readFileSync(NFT_STORE_FILE, "utf-8");
      const data = JSON.parse(content);
      if (typeof data === "object" && data !== null) {
        for (const [address, nfts] of Object.entries(data)) {
          if (Array.isArray(nfts)) {
            nftStore.set(address.toLowerCase(), nfts as OwnedNFT[]);
          }
        }
      }
    }
  } catch {
    // non-blocking
  }
}

function savePersistedNFTs(): void {
  try {
    const dir = path.dirname(NFT_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj: Record<string, OwnedNFT[]> = {};
    for (const [k, v] of nftStore.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(NFT_STORE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch {
    // non-blocking
  }
}

const nftStore = globalThis.__mintpilot_nft_store ?? new Map<string, OwnedNFT[]>();
if (!globalThis.__mintpilot_nft_store) {
  globalThis.__mintpilot_nft_store = nftStore;
  loadPersistedNFTs();
  // Ensure eftakhar.ai on-chain verified token #4547 is seeded if not present
  const eftakharKey = "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4";
  if (!nftStore.has(eftakharKey) || (nftStore.get(eftakharKey) || []).length === 0) {
    nftStore.set(eftakharKey, [
      {
        tokenId: "4547",
        contractAddress: "0xD87ADb2E47979d6cb323896B1A9320E0dd132213",
        collectionName: "Ptah Proof of Agent",
        name: "Proof of Agent #4547",
        description: "Proof of Agent marks the early explorers of the agent era - the first to let a Binance Agent do the on-chain work. Soulbound; minted at ptah.trade/poa.",
        tokenStandard: "ERC721",
        chain: "BNB Smart Chain",
        chainId: 56,
        ownerAddress: eftakharKey,
        mintedAt: 1729860000000,
      },
    ]);
    savePersistedNFTs();
  }
}

const agentIdStore = globalThis.__mintpilot_agent_id_map ?? new Map<string, string>([
  ["0x7cf15cd0a75e0f2f2bf887493a367f44c26aa192", "forkmaster.ai"],
  ["0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4", "eftakhar.ai"],
]);
if (!globalThis.__mintpilot_agent_id_map) {
  globalThis.__mintpilot_agent_id_map = agentIdStore;
}

export function getAgentIdForAddress(address?: string): string {
  if (!address) return "forkmaster.ai";
  const key = address.toLowerCase();
  if (agentIdStore.has(key)) {
    return agentIdStore.get(key)!;
  }
  return `agent-${address.slice(2, 8).toLowerCase()}.ai`;
}

export function setAgentIdForAddress(address: string, agentId: string): void {
  agentIdStore.set(address.toLowerCase(), agentId);
}

export function recordOwnedNFT(walletAddress: string, nft: OwnedNFT): void {
  const key = walletAddress.toLowerCase();
  const existing = nftStore.get(key) || [];
  const index = existing.findIndex(
    item => item.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase() && item.tokenId === nft.tokenId
  );
  if (index >= 0) {
    existing[index] = { ...existing[index], ...nft };
  } else {
    existing.unshift(nft);
  }
  nftStore.set(key, existing);
  savePersistedNFTs();
}

export function getOwnedNFTs(walletAddress: string): OwnedNFT[] {
  return nftStore.get(walletAddress.toLowerCase()) || [];
}

export function getOrCreateSession(sessionId: string): ServerSessionData {
  let session = sessionStore.get(sessionId);
  const now = Date.now();

  if (!session) {
    session = {
      sessionId,
      walletInfo: {
        status: "UNCONNECTED",
      },
      activities: [],
      createdAt: now,
      lastActiveAt: now,
    };
    sessionStore.set(sessionId, session);
  } else {
    session.lastActiveAt = now;
  }

  return session;
}

export function updateSessionWallet(
  sessionId: string,
  walletInfo: Partial<WalletSessionInfo>
): ServerSessionData {
  const session = getOrCreateSession(sessionId);
  session.walletInfo = {
    ...session.walletInfo,
    ...walletInfo,
  };
  return session;
}

export function setActivePreview(
  sessionId: string,
  candidate: TransactionCandidate
): void {
  const session = getOrCreateSession(sessionId);
  session.activePreview = candidate;
  previewCache.set(candidate.previewId, candidate);

  addActivity(sessionId, {
    type: "PREVIEW_CREATED",
    title: "Transaction Preview Generated",
    description: `Previewed mint of ${candidate.quantity} NFT (${candidate.collectionName}) for ${candidate.totalCostBnb} BNB`,
    details: {
      contract: candidate.contractAddress,
      totalCostBnb: candidate.totalCostBnb,
      estimatedGasFeeBnb: candidate.estimatedGasFeeBnb,
    },
  });
}

export function getActivePreview(
  sessionId: string,
  previewId?: string
): TransactionCandidate | undefined {
  // Check global cache by previewId first (bulletproof across route bundles)
  if (previewId && previewCache.has(previewId)) {
    const candidate = previewCache.get(previewId)!;
    if (Date.now() <= candidate.expiresAt) {
      return candidate;
    } else {
      previewCache.delete(previewId);
    }
  }

  const session = sessionStore.get(sessionId);
  if (session && session.activePreview) {
    if (Date.now() <= session.activePreview.expiresAt) {
      return session.activePreview;
    } else {
      session.activePreview = undefined;
    }
  }

  // Fallback search across active previewCache
  if (previewId) {
    for (const [id, c] of previewCache.entries()) {
      if (id === previewId && Date.now() <= c.expiresAt) {
        return c;
      }
    }
  }

  return undefined;
}

export function clearActivePreview(sessionId: string, previewId?: string): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.activePreview = undefined;
    session.isExecuting = false;
  }
  if (previewId) {
    previewCache.delete(previewId);
  }
}

export function setSessionExecuting(sessionId: string, executing: boolean): void {
  const session = getOrCreateSession(sessionId);
  session.isExecuting = executing;
}

export function isSessionExecuting(sessionId: string): boolean {
  const session = sessionStore.get(sessionId);
  return session?.isExecuting ?? false;
}

export function setLastExecution(sessionId: string, execution: ExecutionResult): void {
  const session = getOrCreateSession(sessionId);
  session.lastExecution = execution;
  session.isExecuting = false;

  addActivity(sessionId, {
    type: execution.status === "CONFIRMED" || execution.status === "BROADCASTED" ? "TX_CONFIRMED" : "TX_FAILED",
    title: execution.status === "CONFIRMED" ? "Mint Confirmed On-Chain" : (execution.status === "BROADCASTED" ? "Transaction Broadcasted" : "Transaction Failed"),
    description: execution.errorMessage || `Transaction Hash: ${execution.txHash || "N/A"}`,
    txHash: execution.txHash,
    explorerUrl: execution.explorerUrl,
    details: { ...execution },
  });
}

export function getLastExecution(sessionId: string): ExecutionResult | undefined {
  return sessionStore.get(sessionId)?.lastExecution;
}

export function addActivity(
  sessionId: string,
  item: Omit<ActivityItem, "id" | "timestamp">
): ActivityItem {
  const session = getOrCreateSession(sessionId);
  const activity: ActivityItem = {
    ...item,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  session.activities.unshift(activity);
  // Cap at 50 activity items
  if (session.activities.length > 50) {
    session.activities.pop();
  }

  return activity;
}

export function getSessionActivities(sessionId: string): ActivityItem[] {
  return sessionStore.get(sessionId)?.activities || [];
}
