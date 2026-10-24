import { describe, it, expect, beforeEach } from "vitest";
import { buildMintTransactionCandidate } from "@/lib/nft/mint-transaction-builder";
import {
  createTransactionPreview,
} from "@/lib/transactions/preview-service";
import {
  executeConfirmedTransaction,
} from "@/lib/transactions/execution-service";
import {
  getOrCreateSession,
  clearActivePreview,
  getActivePreview,
} from "@/lib/session/store";
import { DevMockBawProvider } from "@/lib/wallet/dev-mock-provider";
import { setWalletProvider } from "@/lib/wallet/factory";
import { NFTCollectionCandidate } from "@/types";

describe("Transaction Handling & Confirmation State Machine", () => {
  const sessionId = "test-session-123";
  const mockCollection: NFTCollectionCandidate = {
    collectionName: "Pixel Garden",
    sourceUrl: "https://pixelgarden.io/mint",
    chain: "BNB Smart Chain",
    chainId: 56,
    contractAddress: "0x1234567890123456789012345678901234567890",
    tokenStandard: "ERC721",
    mintPrice: "0.01",
    mintPriceWei: "10000000000000000",
    mintPriceSource: "official_website",
    isVerifiedContract: true,
    isBytecodeContract: true,
    supportedMintFunction: {
      name: "mint",
      signature: "mint(address)",
      isPayable: true,
      inputs: [{ name: "recipient", type: "address" }],
    },
    warnings: [],
    sourcesUsed: ["Test Suite"],
  };

  const recipient = "0x71C67ed30793C350BA622322AC0CE37883F0b590";

  beforeEach(() => {
    setWalletProvider(new DevMockBawProvider());
    clearActivePreview(sessionId);
    getOrCreateSession(sessionId);
  });

  it("should calculate exact transaction value in Wei with BigInt", () => {
    const candidate = buildMintTransactionCandidate({
      collection: mockCollection,
      recipientAddress: recipient,
      fromAddress: recipient,
      quantity: 3,
      overridePriceBnb: "0.01",
    });

    // 3 * 0.01 BNB = 0.03 BNB = 30000000000000000 Wei
    expect(candidate.totalValueWei).toBe("30000000000000000");
    expect(candidate.totalCostBnb).toBe("0.0300");
    expect(candidate.calldata.startsWith("0x")).toBe(true);
    expect(candidate.quantity).toBe(3);
  });

  it("should create a valid preview with wallet requestId", async () => {
    const candidate = buildMintTransactionCandidate({
      collection: mockCollection,
      recipientAddress: recipient,
      fromAddress: recipient,
      quantity: 1,
    });

    const previewResult = await createTransactionPreview(sessionId, candidate);

    expect(previewResult.walletRequestId).toBeTruthy();
    expect(previewResult.candidate.walletRequestId).toBe(previewResult.walletRequestId);

    const stored = getActivePreview(sessionId);
    expect(stored).toBeDefined();
    expect(stored?.previewId).toBe(candidate.previewId);
  });

  it("should reject execution if no active preview exists", async () => {
    clearActivePreview(sessionId);

    await expect(
      executeConfirmedTransaction({
        sessionId,
        previewId: "non-existent-id",
        walletRequestId: "req-123",
      })
    ).rejects.toThrow("No active or unexpired transaction preview found");
  });

  it("should reject execution if preview ID does not match", async () => {
    const candidate = buildMintTransactionCandidate({
      collection: mockCollection,
      recipientAddress: recipient,
      fromAddress: recipient,
      quantity: 1,
    });

    const preview = await createTransactionPreview(sessionId, candidate);

    await expect(
      executeConfirmedTransaction({
        sessionId,
        previewId: "different-preview-id",
        walletRequestId: preview.walletRequestId,
      })
    ).rejects.toThrow("Preview ID mismatch");
  });

  it("should successfully execute previewed transaction and clear active preview", async () => {
    const candidate = buildMintTransactionCandidate({
      collection: mockCollection,
      recipientAddress: recipient,
      fromAddress: recipient,
      quantity: 1,
    });

    const preview = await createTransactionPreview(sessionId, candidate);

    const execResult = await executeConfirmedTransaction({
      sessionId,
      previewId: candidate.previewId,
      walletRequestId: preview.walletRequestId,
    });

    expect(execResult.status).toBe("BROADCASTED");
    expect(execResult.txHash).toBeTruthy();
    expect(execResult.explorerUrl).toContain("bscscan.com/tx/");

    // Active preview must be cleared to prevent double execution
    const storedAfter = getActivePreview(sessionId);
    expect(storedAfter).toBeUndefined();
  });
});
