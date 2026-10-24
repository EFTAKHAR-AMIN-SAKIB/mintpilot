import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
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

const execAsync = promisify(exec);

export class BawCliProvider implements IBinanceAgenticWalletProvider {
  public readonly name = "Binance Agentic Wallet CLI";
  public readonly isDevelopmentMode = false;
  private bawPath: string;

  constructor() {
    // Resolve absolute path to the local baw executable in node_modules
    this.bawPath = path.resolve(process.cwd(), "node_modules", "@binance", "agentic-wallet", "dist", "index.js");
  }

  private async runBawCommand(args: string[]): Promise<any> {
    const command = `node "${this.bawPath}" ${args.join(" ")}`;
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 15000,
        env: { ...process.env },
      });

      if (!stdout && stderr) {
        throw new Error(stderr);
      }

      // Extract JSON from output (some versions may print logs before JSON)
      const jsonStart = stdout.indexOf("{");
      if (jsonStart === -1) {
        throw new Error(`Invalid non-JSON response from baw: ${stdout || stderr}`);
      }
      const jsonString = stdout.slice(jsonStart);
      return JSON.parse(jsonString);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`baw command failed [${args.join(" ")}]: ${message}`);
    }
  }

  async getWalletStatus(): Promise<WalletStatusResponse> {
    try {
      const res = await this.runBawCommand(["wallet", "status", "--json"]);
      if (res && res.data) {
        const rawStatus = res.data.status || "UNCONNECTED";
        const isConnected = rawStatus === "CONNECTED";
        return {
          status: isConnected ? "CONNECTED" : "UNCONNECTED",
          address: res.data.address,
          binanceChainId: res.data.chainId || "56",
          isDevelopmentProvider: false,
          details: res.data,
        };
      }
      return { status: "UNCONNECTED", isDevelopmentProvider: false };
    } catch {
      return { status: "UNCONNECTED", isDevelopmentProvider: false };
    }
  }

  async createPairingSession(): Promise<PairingSessionResponse> {
    const res = await this.runBawCommand(["auth", "signin", "--json"]);
    if (!res || !res.success || !res.data) {
      throw new Error("Failed to initiate Binance Agentic Wallet pairing session");
    }

    const { qrCodeId, expireAt, urlForWeb, pairingCode } = res.data;

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
      // fallback without data url
    }

    return {
      qrCodeId,
      expireAt: Number(expireAt),
      urlForWeb,
      pairingCode,
      qrDataUrl,
      isDevelopmentProvider: false,
    };
  }

  async verifyPairing(qrCodeId: string): Promise<VerifyPairingResponse> {
    try {
      const res = await this.runBawCommand(["auth", "verify", "--qrCodeId", qrCodeId, "--json"]);
      if (res && res.data) {
        if (res.data.status === "CONFIRMED" || res.data.status === "CONNECTED") {
          return {
            status: "CONNECTED",
            address: res.data.address,
            binanceChainId: res.data.chainId || "56",
          };
        }
        if (res.data.status === "EXPIRED") {
          return { status: "EXPIRED", message: "QR code expired" };
        }
        if (res.data.status === "REJECTED") {
          return { status: "REJECTED", message: "Pairing was rejected in Binance app" };
        }
      }
      return { status: "PENDING" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("expired") || msg.includes("AUTH_REJECTED")) {
        return { status: "EXPIRED", message: "QR pairing expired" };
      }
      return { status: "PENDING", message: msg };
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.runBawCommand(["auth", "signout"]);
    } catch {
      // Ignore errors on signout
    }
  }

  async getSettings(): Promise<WalletSettingsResponse> {
    try {
      const res = await this.runBawCommand(["wallet", "settings", "--json"]);
      const devModeEnabled = res?.data?.devMode?.enabled === true;
      let dailySpendingLimitUsd: string | undefined;
      let remainingQuotaUsd: string | undefined;

      try {
        const quotaRes = await this.runBawCommand(["wallet", "left-quota", "--json"]);
        if (quotaRes?.data) {
          dailySpendingLimitUsd = quotaRes.data.dailySpendingLimit;
          remainingQuotaUsd = quotaRes.data.remainingQuota;
        }
      } catch {
        // quota command optional
      }

      return {
        devModeEnabled,
        dailySpendingLimitUsd,
        remainingQuotaUsd,
      };
    } catch {
      return {
        devModeEnabled: false,
      };
    }
  }

  async previewContractCall(params: ContractCallPreviewParams): Promise<ContractCallPreviewResult> {
    const args = [
      "contract-call",
      "preview",
      "--binanceChainId",
      params.binanceChainId,
      "--from",
      params.from,
      "--to",
      params.to,
      "--value",
      params.valueWei,
      "--inputData",
      params.inputData,
      "--json",
    ];

    if (params.gasLimit) {
      args.push("--gasLimit", params.gasLimit);
    }

    const res = await this.runBawCommand(args);
    if (!res || !res.success || !res.data) {
      throw new Error(res?.error?.message || "Contract call preview failed");
    }

    return {
      requestId: res.data.requestId,
      success: true,
      parsedTx: res.data.parsedTx,
      estimatedGas: res.data.estimatedGas,
      estimatedGasFeeBnb: res.data.estimatedGasFeeBnb,
      potentialRisks: res.data.potentialRisks || [],
      authorityChanges: res.data.authorityChanges || [],
      rawResponse: res.data,
    };
  }

  async executeContractCall(requestId: string): Promise<ContractCallExecuteResult> {
    const res = await this.runBawCommand([
      "contract-call",
      "execute",
      "--requestId",
      requestId,
      "--json",
    ]);

    if (!res || !res.success || !res.data) {
      return {
        requestId,
        status: "FAILED",
        errorMessage: res?.error?.message || "Execution request failed",
        rawResponse: res,
      };
    }

    const status = res.data.status === "BROADCASTED" ? "BROADCASTED" : "PENDING_CONFIRMATION";
    return {
      requestId,
      status,
      txHash: res.data.txHash,
      rawResponse: res.data,
    };
  }
}
