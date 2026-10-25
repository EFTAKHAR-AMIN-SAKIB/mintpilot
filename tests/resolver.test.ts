import { describe, it, expect } from "vitest";
import { resolveNFTCollection, KNOWN_BSC_COLLECTIONS } from "@/lib/nft/collection-resolver";

describe("Collection Resolver & Bytecode Verification", () => {
  it("should resolve curated BSC collection by name", async () => {
    const candidate = await resolveNFTCollection({
      collectionName: "pancakesquad",
      maximumMintPrice: "0.15",
    });

    expect(candidate.collectionName).toBe("PancakeSquad");
    expect(candidate.chain).toBe("BNB Smart Chain");
    expect(candidate.chainId).toBe(56);
    expect(candidate.contractAddress.toLowerCase()).toBe("0x0a8901b0e25deb55a87524f0cc164e9644020eba");
    expect(candidate.isBytecodeContract).toBe(true);
    expect(candidate.isVerifiedContract).toBe(true);
    expect(candidate.supportedMintFunction?.name).toBe("mint");
  });

  it("should verify and accept real deployed smart contracts on BSC", async () => {
    // PancakeSquad official contract on BSC Mainnet
    const candidate = await resolveNFTCollection({
      contractAddress: "0x0a8901b0E25DEb55A87524f0cC164E9644020EBA",
      maximumMintPrice: "0.15",
    });

    expect(candidate.contractAddress.toLowerCase()).toBe("0x0a8901b0e25deb55a87524f0cc164e9644020eba");
    expect(candidate.isBytecodeContract).toBe(true);
    expect(candidate.mintPrice).toBe("0.15");
    expect(candidate.mintPriceSource).toBe("user_specified");
  });

  it("should REJECT EOA addresses that are not smart contracts", async () => {
    // 0x4095...00e3 is an EOA on BSC Mainnet (no deployed bytecode)
    await expect(
      resolveNFTCollection({
        contractAddress: "0x409549f3be4cbba1a8d0b2f534e326b47c0500e3",
      })
    ).rejects.toThrow(/not a smart contract/i);
  });

  it("should resolve Ptah Proof of Agent and detect zero-argument mint() function", async () => {
    const candidate = await resolveNFTCollection({
      contractAddress: "0xD87ADb2E47979d6cb323896B1A9320E0dd132213",
      maximumMintPrice: "0",
    });

    expect(candidate.isBytecodeContract).toBe(true);
    expect(candidate.supportedMintFunction?.signature).toBe("mint()");
    expect(candidate.supportedMintFunction?.inputs?.length || 0).toBe(0);
  });

  it("should reject unreachable source URL when no contract is discoverable", async () => {
    await expect(
      resolveNFTCollection({
        url: "https://non-existent-domain-404-safe-test.xyz/mint",
        collectionName: "Mystery Collection",
      })
    ).rejects.toThrow();
  });
});
