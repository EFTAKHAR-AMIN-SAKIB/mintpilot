import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";
import QRCode from "qrcode";
import { IBinanceAgenticWalletProvider } from "./provider";
import { DevMockBawProvider } from "./dev-mock-provider";
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
  private fallbackProvider?: DevMockBawProvider;

  constructor() {
    const localCliPath = path.resolve(process.cwd(), "node_modules", "@binance", "agentic-wallet", "dist", "index.js");
    const binCliPath = path.resolve(process.cwd(), "bin", "baw.js");
    this.bawPath = fs.existsSync(localCliPath) ? localCliPath : binCliPath;
  }

  private getFallback(): DevMockBawProvider {
    if (!this.fallbackProvider) {
      this.fallbackProvider = new DevMockBawProvider();
    }
    return this.fallbackProvider;
  }

  private async runBawCommand(args: string[]): Promise<any> {
    if (!fs.existsSync(this.bawPath)) {
      throw new Error(`BAW CLI not found at ${this.bawPath}`);
    }

    const bawDir = process.env.BINANCE_BAW_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), ".baw") : undefined);
    const command = `node "${this.bawPath}" ${args.join(" ")}`;
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 15000,
        env: {
          ...process.env,
          ...(bawDir ? { BINANCE_BAW_DIR: bawDir, HOME: path.dirname(bawDir) } : {}),
        },
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
    } catch (err: any) {
      // If baw printed JSON error in stdout despite exiting with code 1
      if (err?.stdout) {
        const jsonStart = err.stdout.indexOf("{");
        if (jsonStart !== -1) {
          try {
            const parsed = JSON.parse(err.stdout.slice(jsonStart));
            if (parsed?.error?.message) {
              throw new Error(parsed.error.message);
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes("JSON")) {
              throw parseErr;
            }
          }
        }
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(message);
    }
  }

  async getWalletAddress(): Promise<string | undefined> {
    try {
      const res = await this.runBawCommand(["wallet", "address", "--json"]);
      if (res && res.data && Array.isArray(res.data.addresses)) {
        // Find BSC address (binanceChainId: "56" or chainName: "BSC")
        const bsc = res.data.addresses.find(
          (a: any) => String(a.binanceChainId) === "56" || a.chainName?.toUpperCase() === "BSC"
        );
        if (bsc && bsc.address) return bsc.address;
        // Or find any 0x EVM address
        const evm = res.data.addresses.find((a: any) => a.address?.startsWith("0x"));
        if (evm && evm.address) return evm.address;
        return res.data.addresses[0]?.address;
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  async getWalletStatus(): Promise<WalletStatusResponse> {
    try {
      const res = await this.runBawCommand(["wallet", "status", "--json"]);
      if (res && res.data) {
        const rawStatus = res.data.status || "UNCONNECTED";
        const isConnected = rawStatus === "CONNECTED";
        let address = res.data.address;

        if (isConnected && !address) {
          address = await this.getWalletAddress();
        }

        return {
          status: isConnected ? "CONNECTED" : "UNCONNECTED",
          address,
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
    try {
      if (!fs.existsSync(this.bawPath)) {
        return this.getFallback().createPairingSession();
      }

      const res = await this.runBawCommand(["auth", "signin", "--json"]);
      if (!res || !res.success || !res.data) {
        return this.getFallback().createPairingSession();
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
    } catch {
      return this.getFallback().createPairingSession();
    }
  }

  async verifyPairing(qrCodeId: string): Promise<VerifyPairingResponse> {
    try {
      // First check if wallet is already connected
      const current = await this.getWalletStatus();
      if (current.status === "CONNECTED" && current.address) {
        return {
          status: "CONNECTED",
          address: current.address,
          binanceChainId: current.binanceChainId || "56",
        };
      }

      const res = await this.runBawCommand(["auth", "verify", "--qrCodeId", qrCodeId, "--json"]);
      if (res && res.data) {
        if (res.data.status === "CONFIRMED" || res.data.status === "CONNECTED") {
          const address = res.data.address || (await this.getWalletAddress());
          return {
            status: "CONNECTED",
            address,
            binanceChainId: res.data.chainId || "56",
          };
        }
        if (res.data.status === "EXPIRED") {
          // Double check status before declaring expired
          const recheck = await this.getWalletStatus();
          if (recheck.status === "CONNECTED" && recheck.address) {
            return {
              status: "CONNECTED",
              address: recheck.address,
              binanceChainId: recheck.binanceChainId || "56",
            };
          }
          return { status: "EXPIRED", message: "QR code expired" };
        }
        if (res.data.status === "REJECTED") {
          return { status: "REJECTED", message: "Pairing was rejected in Binance app" };
        }
      }

      // Check again if status became CONNECTED
      const fallback = await this.getWalletStatus();
      if (fallback.status === "CONNECTED" && fallback.address) {
        return {
          status: "CONNECTED",
          address: fallback.address,
          binanceChainId: fallback.binanceChainId || "56",
        };
      }

      return { status: "PENDING" };
    } catch (err: unknown) {
      // If error (such as QR code consumed), check wallet status
      const fallback = await this.getWalletStatus().catch(() => null);
      if (fallback && fallback.status === "CONNECTED" && fallback.address) {
        return {
          status: "CONNECTED",
          address: fallback.address,
          binanceChainId: fallback.binanceChainId || "56",
        };
      }

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
      let dailySpendingLimitUsd = res?.data?.dailyLimit ? String(res.data.dailyLimit) : undefined;
      let remainingQuotaUsd = res?.data?.quotaLeft ? String(res.data.quotaLeft) : undefined;

      try {
        const quotaRes = await this.runBawCommand(["wallet", "left-quota", "--json"]);
        if (quotaRes?.data) {
          if (quotaRes.data.dailySpendingLimit) dailySpendingLimitUsd = quotaRes.data.dailySpendingLimit;
          if (quotaRes.data.remainingQuota) remainingQuotaUsd = quotaRes.data.remainingQuota;
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
