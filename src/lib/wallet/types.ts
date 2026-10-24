import { WalletAuthStatus } from "@/types";

export interface WalletStatusResponse {
  status: WalletAuthStatus;
  address?: string;
  binanceChainId?: string;
  isDevMode?: boolean;
  isDevelopmentProvider: boolean;
  details?: Record<string, unknown>;
}

export interface PairingSessionResponse {
  qrCodeId: string;
  pairingCode: string;
  urlForWeb: string;
  expireAt: number;
  qrDataUrl?: string; // Generated data URL for direct QR rendering
  isDevelopmentProvider: boolean;
}

export interface VerifyPairingResponse {
  status: "CONNECTED" | "PENDING" | "EXPIRED" | "REJECTED";
  address?: string;
  binanceChainId?: string;
  isDevMode?: boolean;
  message?: string;
}

export interface WalletSettingsResponse {
  devModeEnabled: boolean;
  dailySpendingLimitUsd?: string;
  remainingQuotaUsd?: string;
}

export interface ContractCallPreviewParams {
  binanceChainId: string;
  from: `0x${string}`;
  to: `0x${string}`;
  valueWei: string;
  inputData: `0x${string}`;
  gasLimit?: string;
}

export interface ContractCallPreviewResult {
  requestId: string;
  success: boolean;
  parsedTx?: {
    to: string;
    value: string;
    method?: string;
    decodedArgs?: Record<string, unknown>;
  };
  estimatedGas?: string;
  estimatedGasFeeBnb?: string;
  potentialRisks?: string[];
  authorityChanges?: string[];
  rawResponse?: unknown;
}

export interface ContractCallExecuteResult {
  requestId: string;
  status: "BROADCASTED" | "PENDING_CONFIRMATION" | "FAILED";
  txHash?: `0x${string}`;
  errorMessage?: string;
  rawResponse?: unknown;
}
