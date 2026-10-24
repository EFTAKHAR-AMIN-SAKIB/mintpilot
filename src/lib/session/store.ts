import {
  TransactionCandidate,
  ExecutionResult,
  ActivityItem,
  WalletSessionInfo,
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

const sessionStore = new Map<string, ServerSessionData>();

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

export function getActivePreview(sessionId: string): TransactionCandidate | undefined {
  const session = sessionStore.get(sessionId);
  if (!session || !session.activePreview) return undefined;

  // Check expiration
  if (Date.now() > session.activePreview.expiresAt) {
    session.activePreview = undefined;
    return undefined;
  }

  return session.activePreview;
}

export function clearActivePreview(sessionId: string): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.activePreview = undefined;
    session.isExecuting = false;
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
