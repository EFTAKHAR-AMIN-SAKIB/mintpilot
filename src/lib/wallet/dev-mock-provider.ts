import QRCode from "qrcode";
import { IBinanceAgenticWalletProvider } from "./provider";
import {
  WalletStatusResponse,
  PairingSessionResponse,
  VerifyPairingResponse,
  WalletSettingsResponse,
  ContractCallPreviewParams,
  ContractCallPreviewResult,
  ContractCallExecuteResult,
} from "./types";

interface MockSessionState {
  isConnected: boolean;
  address: string;
  qrCodeId: string | null;
  expireAt: number;
}

const DEFAULT_WALLET_ADDRESS =
  process.env.DEFAULT_WALLET_ADDRESS || "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4";

const mockState: MockSessionState = {
  isConnected: false,
  address: DEFAULT_WALLET_ADDRESS,
  qrCodeId: null,
  expireAt: 0,
};

export class DevMockBawProvider implements IBinanceAgenticWalletProvider {
  public readonly name = "Binance Agentic Wallet (Simulated Dev Mode)";
  public readonly isDevelopmentMode = true;

  async getWalletStatus(): Promise<WalletStatusResponse> {
    return {
      status: mockState.isConnected ? "CONNECTED" : "UNCONNECTED",
      address: mockState.isConnected ? (mockState.address || DEFAULT_WALLET_ADDRESS) : undefined,
      binanceChainId: "56",
      isDevMode: true,
      isDevelopmentProvider: true,
      details: {
        agentId: "eftakhar.ai",
        providerNote: "Binance Agentic Wallet Keyless MPC",
      },
    };
  }

  async createPairingSession(): Promise<PairingSessionResponse> {
    const qrCodeId = `baw-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expireAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const urlForWeb = `https://app.binance.com/uni-qr/${pairingCode}`;

    mockState.qrCodeId = qrCodeId;
    mockState.expireAt = expireAt;
    mockState.address = DEFAULT_WALLET_ADDRESS;

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(urlForWeb, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch {
      // fallback
    }

    return {
      qrCodeId,
      expireAt,
      urlForWeb,
      pairingCode,
      qrDataUrl,
      isDevelopmentProvider: false,
    };
  }

  async verifyPairing(qrCodeId: string): Promise<VerifyPairingResponse> {
    if (!qrCodeId) {
      return { status: "EXPIRED", message: "Missing session ID" };
    }

    mockState.isConnected = true;
    mockState.address = DEFAULT_WALLET_ADDRESS;

    return {
      status: "CONNECTED",
      address: mockState.address,
      binanceChainId: "56",
      isDevMode: true,
      message: "Connected via Binance Agentic Wallet MPC",
    };
  }

  async disconnect(): Promise<void> {
    mockState.isConnected = false;
    mockState.qrCodeId = null;
  }

  async getSettings(): Promise<WalletSettingsResponse> {
    return {
      devModeEnabled: true,
      dailySpendingLimitUsd: "500.00",
      remainingQuotaUsd: "485.50",
    };
  }

  async previewContractCall(params: ContractCallPreviewParams): Promise<ContractCallPreviewResult> {
    const requestId = `req-dev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Estimate realistic gas for standard NFT minting on BSC: ~85,000 gas at 3 gwei
    const estimatedGas = "95000";
    const gasPriceGwei = 3n;
    const gasFeeWei = BigInt(estimatedGas) * (gasPriceGwei * 1000000000n);
    const estimatedGasFeeBnb = (Number(gasFeeWei) / 1e18).toFixed(6);

    return {
      requestId,
      success: true,
      parsedTx: {
        to: params.to,
        value: params.valueWei,
        method: "mint(address)",
        decodedArgs: {
          recipient: params.from,
          valueWei: params.valueWei,
        },
      },
      estimatedGas,
      estimatedGasFeeBnb,
      potentialRisks: [
        "Development Mode Notice: This is a simulated transaction preview.",
        "Always verify that you trust the smart contract before approving.",
      ],
      authorityChanges: [],
      rawResponse: {
        devMode: true,
        note: "Simulated preview response for local development without live Binance App.",
      },
    };
  }

  async executeContractCall(requestId: string): Promise<ContractCallExecuteResult> {
    // Generate a reproducible mock txHash
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const txHash = `0x${randomHex}` as `0x${string}`;

    return {
      requestId,
      status: "BROADCASTED",
      txHash,
      rawResponse: {
        devMode: true,
        status: "BROADCASTED",
        simulated: true,
      },
    };
  }
}
