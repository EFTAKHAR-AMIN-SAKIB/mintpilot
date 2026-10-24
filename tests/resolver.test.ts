import { describe, it, expect } from "vitest";
import { resolveNFTCollection, KNOWN_BSC_COLLECTIONS } from "@/lib/nft/collection-resolver";

describe("Collection Resolver", () => {
  it("should resolve curated BSC collection by name", async () => {
    const candidate = await resolveNFTCollection({
      collectionName: "pixel garden",
      maximumMintPrice: "0.01",
    });

    expect(candidate.collectionName).toBe("Pixel Garden");
    expect(candidate.chain).toBe("BNB Smart Chain");
    expect(candidate.chainId).toBe(56);
    expect(candidate.contractAddress).toBe("0x1234567890123456789012345678901234567890");
    expect(candidate.mintPrice).toBe("0.01");
    expect(candidate.mintPriceWei).toBe("10000000000000000");
    expect(candidate.supportedMintFunction?.name).toBe("mint");
  });

  it("should handle direct contract address resolution safely", async () => {
    const candidate = await resolveNFTCollection({
      contractAddress: "0x0a8901b0E25DEb55A87524f0cC164E9b3997DE54",
      maximumMintPrice: "0.15",
    });

    expect(candidate.contractAddress).toBe("0x0a8901b0E25DEb55A87524f0cC164E9b3997DE54");
    expect(candidate.mintPrice).toBe("0.15");
    expect(candidate.mintPriceSource).toBe("user_specified");
    expect(candidate.warnings.length).toBeGreaterThan(0);
  });

  it("should fallback safely with warning when source URL is unreachable", async () => {
    const candidate = await resolveNFTCollection({
      url: "https://non-existent-domain-404-safe-test.xyz/mint",
      collectionName: "Mystery Collection",
    });

    expect(candidate.collectionName).toBeTruthy();
    expect(candidate.contractAddress).toBeTruthy();
    expect(candidate.warnings.some((w) => w.includes("warning") || w.includes("Verification"))).toBe(true);
  });
});
