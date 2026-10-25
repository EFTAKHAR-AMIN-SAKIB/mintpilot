import { describe, it, expect } from "vitest";
import { resolveNftImageUrl, fetchTokenMetadata, discoverWalletNFTs } from "@/lib/nft/nft-indexer";
import { recordOwnedNFT, getOwnedNFTs } from "@/lib/session/store";
import { OwnedNFT } from "@/types";

describe("Agentic Wallet NFT Vault & Indexer", () => {
  const testOwner = "0x7Cf15cd0A75e0f2f2bf887493a367f44C26aA192";
  const aivyContract = "0x77cCE940d1Fe4808aB6cf8484d45d8B51139E7D6";

  it("should normalize IPFS URIs to reliable gateways", () => {
    const aivyIpfs = "ipfs://bafybeid6sm5oloj5nl3ib4q76tdhaoykqgdttyj66vmbpuedlfoloswp2m";
    const resolvedAivy = resolveNftImageUrl(aivyIpfs);
    expect(resolvedAivy).toContain("aivy.me/public/assets/agent-0001-cover.png");

    const genericIpfs = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    const resolvedGeneric = resolveNftImageUrl(genericIpfs);
    expect(resolvedGeneric).toContain("dweb.link/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
  });

  it("should fetch real on-chain metadata for minted token #4684 on BSC", async () => {
    const details = await fetchTokenMetadata(aivyContract, "4684", 56);

    expect(details.tokenId).toBe("4684");
    expect(details.contractAddress).toBe(aivyContract);
    expect(details.name).toContain("AIVY Robot #4684");
    expect(details.collectionName).toBe("AIVY Robot");
    expect(details.ownerAddress?.toLowerCase()).toBe(testOwner.toLowerCase());
    expect(details.attributes).toBeDefined();
    expect(details.attributes!.length).toBeGreaterThan(0);
    expect(details.derived).toBeDefined();
  });

  it("should record and retrieve owned NFTs from session store", () => {
    const mockNft: OwnedNFT = {
      tokenId: "4684",
      contractAddress: aivyContract,
      collectionName: "AIVY Robot",
      name: "AIVY Robot #4684",
      tokenStandard: "ERC721",
      chain: "BNB Smart Chain",
      chainId: 56,
      ownerAddress: testOwner,
      imageUrl: "https://aivy.me/public/assets/agent-0001-cover.png",
      mintedAt: Date.now(),
    };

    recordOwnedNFT(testOwner, mockNft);
    const retrieved = getOwnedNFTs(testOwner);

    expect(retrieved.length).toBeGreaterThanOrEqual(1);
    expect(retrieved.some((n) => n.tokenId === "4684")).toBe(true);
  });

  it("should discover wallet NFTs via on-chain balance & contract indexer", async () => {
    const nfts = await discoverWalletNFTs(testOwner, 56);

    expect(nfts.length).toBeGreaterThanOrEqual(1);
    const aivyRobot = nfts.find((n) => n.contractAddress.toLowerCase() === aivyContract.toLowerCase());
    expect(aivyRobot).toBeDefined();
    expect(aivyRobot?.tokenId).toBe("4684");
    expect(aivyRobot?.collectionName).toBe("AIVY Robot");
  });
});
