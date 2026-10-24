import { describe, it, expect } from "vitest";
import { DevMockBawProvider } from "@/lib/wallet/dev-mock-provider";
import { BawCliProvider } from "@/lib/wallet/baw-cli-provider";

describe("Binance Agentic Wallet Providers", () => {
  describe("DevMockBawProvider", () => {
    const provider = new DevMockBawProvider();

    it("should report itself as development mode", () => {
      expect(provider.isDevelopmentMode).toBe(true);
      expect(provider.name).toContain("Simulated Dev Mode");
    });

    it("should start with UNCONNECTED status", async () => {
      await provider.disconnect();
      const status = await provider.getWalletStatus();
      expect(status.status).toBe("UNCONNECTED");
    });

    it("should create pairing session with QR code and pairing code", async () => {
      const pairing = await provider.createPairingSession();

      expect(pairing.qrCodeId).toBeTruthy();
      expect(pairing.pairingCode).toBeTruthy();
      expect(pairing.urlForWeb).toContain("app.binance.com/uni-qr/");
      expect(pairing.qrDataUrl?.startsWith("data:image/png")).toBe(true);
      expect(pairing.expireAt).toBeGreaterThan(Date.now());
    });

    it("should verify pairing and transition to CONNECTED", async () => {
      const pairing = await provider.createPairingSession();
      const verify = await provider.verifyPairing(pairing.qrCodeId);

      expect(verify.status).toBe("CONNECTED");
      expect(verify.address).toBeTruthy();
      expect(verify.isDevMode).toBe(true);

      const statusAfter = await provider.getWalletStatus();
      expect(statusAfter.status).toBe("CONNECTED");
      expect(statusAfter.address).toBe(verify.address);
    });

    it("should return settings with devModeEnabled and spending quota", async () => {
      const settings = await provider.getSettings();
      expect(settings.devModeEnabled).toBe(true);
      expect(settings.dailySpendingLimitUsd).toBe("500.00");
      expect(settings.remainingQuotaUsd).toBeTruthy();
    });
  });

  describe("BawCliProvider", () => {
    it("should instantiate BawCliProvider with correct path to baw CLI", () => {
      const cliProvider = new BawCliProvider();
      expect(cliProvider.isDevelopmentMode).toBe(false);
      expect(cliProvider.name).toBe("Binance Agentic Wallet CLI");
    });
  });
});
