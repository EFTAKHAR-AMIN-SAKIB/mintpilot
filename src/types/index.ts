/**
 * MintPilot Core Type Definitions
 */

export type ChainId = 56 | 97; // BSC Mainnet (56), BSC Testnet (97)
export type ChainMode = "mainnet" | "testnet";

export interface NetworkConfig {
  id: ChainId;
  name: string;
  chainMode: ChainMode;
  binanceChainId: string; // "56" or "97"
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export type WalletAuthStatus = "UNCONNECTED" | "PAIRING" | "CONNECTED" | "EXPIRED" | "REVOKED";

export interface WalletSessionInfo {
  status: WalletAuthStatus;
  address?: string;
  agentId?: string; // Binance Agent ID e.g. "forkmaster.ai"
  walletName?: string; // Display label
  binanceChainId?: string;
  bnbBalance?: string;
  isDevMode?: boolean;
  isDevelopmentProvider?: boolean;
  dailySpendingLimit?: {
    totalLimitUsd?: string;
    remainingQuotaUsd?: string;
    currency?: string;
  };
  pairingData?: {
    qrCodeId: string;
    urlForWeb: string;
    pairingCode: string;
    expireAt: number;
    qrDataUrl?: string;
  };
}

export interface IntentParseRequest {
  prompt: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export type IntentType = "mint_nft" | "informational" | "clarification_needed" | "unknown";

export interface ParsedIntent {
  intentType: IntentType;
  chain: "bsc" | "bsc_testnet" | null;
  collectionName: string | null;
  sourceUrl: string | null;
  contractAddress: `0x${string}` | null;
  quantity: number;
  maximumMintPrice: string | null; // e.g. "0.01" BNB
  currency: "BNB";
  tokenStandard: "ERC721" | "ERC1155" | null;
  functionName: string | null;
  arguments: unknown[];
  missingInformation: string[];
  clarificationQuestion: string | null;
  requiresResolution: boolean;
  confidenceNotes?: string;
}

export interface NFTCollectionCandidate {
  collectionName: string;
  imageUrl?: string;
  sourceUrl: string;
  chain: string;
  chainId: ChainId;
  contractAddress: `0x${string}`;
  tokenStandard: "ERC721" | "ERC1155" | "Unknown";
  mintPrice: string; // in BNB (e.g. "0.01")
  mintPriceWei: string;
  mintPriceSource: "verified_contract" | "official_website" | "user_specified" | "unverified";
  isVerifiedContract: boolean;
  isBytecodeContract: boolean;
  supportedMintFunction?: {
    name: string;
    signature: string;
    isPayable: boolean;
    inputs: Array<{ name: string; type: string }>;
  };
  warnings: string[];
  unresolvedNotes?: string;
  sourcesUsed: string[];
}

export interface TransactionCandidate {
  previewId: string;
  action: "NFT Mint";
  collectionName: string;
  chain: string;
  chainId: ChainId;
  contractAddress: `0x${string}`;
  fromAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
  quantity: number;
  mintPriceBnb: string;
  totalCostBnb: string;
  totalValueWei: string;
  calldata: `0x${string}`;
  functionName: string;
  functionSignature: string;
  arguments: unknown[];
  gasLimit?: string;
  estimatedGas?: string;
  estimatedGasFeeBnb?: string;
  estimatedTotalBnb?: string;
  warnings: string[];
  authorityChanges?: string[];
  createdAt: number;
  expiresAt: number;
  walletRequestId?: string;
}

export type TransactionLifecycleStatus =
  | "IDLE"
  | "RESOLVING"
  | "VERIFYING_COLLECTION"
  | "PREVIEWING"
  | "AWAITING_CONFIRMATION"
  | "SUBMITTING"
  | "PENDING_CONFIRMATION" // Binance app push approval required
  | "BROADCASTED"         // On-chain txHash available
  | "CONFIRMED"           // Mined into block
  | "FAILED"
  | "REJECTED";

export interface ExecutionResult {
  previewId: string;
  status: "CONFIRMED" | "BROADCASTED" | "PENDING_CONFIRMATION" | "FAILED" | "REJECTED";
  txHash?: `0x${string}`;
  blockNumber?: number;
  tokenId?: string;
  explorerUrl?: string;
  errorMessage?: string;
  requiresAppApproval?: boolean;
  gasUsed?: string;
  timestamp: number;
}

export interface OwnedNFT {
  tokenId: string;
  contractAddress: `0x${string}`;
  collectionName: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tokenStandard: "ERC721" | "ERC1155";
  chain: string;
  chainId: number;
  txHash?: string;
  blockNumber?: number;
  mintedAt?: number;
  ownerAddress: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  stats?: Record<string, string | number>;
  derived?: Record<string, string | number>;
  explorerUrl?: string;
}

export interface ActivityItem {
  id: string;
  timestamp: number;
  type:
    | "INTENT_PARSED"
    | "COLLECTION_RESOLVED"
    | "PREVIEW_CREATED"
    | "USER_CONFIRMED"
    | "TX_SUBMITTED"
    | "TX_CONFIRMED"
    | "TX_FAILED";
  title: string;
  description: string;
  details?: Record<string, unknown>;
  txHash?: string;
  explorerUrl?: string;
}

export interface ConversationMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
  stage?:
    | "idle"
    | "resolving"
    | "verification"
    | "preview"
    | "confirming"
    | "executing"
    | "success"
    | "failed";
  verificationData?: NFTCollectionCandidate;
  previewData?: TransactionCandidate;
  executionData?: ExecutionResult;
}
