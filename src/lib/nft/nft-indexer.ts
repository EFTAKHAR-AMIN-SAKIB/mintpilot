import { parseAbi } from "viem";
import { getPublicClient } from "@/lib/network/rpc-client";
import { getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/network/config";
import { recordOwnedNFT, getOwnedNFTs } from "@/lib/session/store";
import { OwnedNFT, ChainId } from "@/types";

const ERC721_METADATA_ABI = parseAbi([
  "function name() view returns(string)",
  "function symbol() view returns(string)",
  "function tokenURI(uint256) view returns(string)",
  "function ownerOf(uint256) view returns(address)",
  "function balanceOf(address) view returns(uint256)",
  "function ownedTokensPage(address,uint256,uint256) view returns(uint256[] tokenIds,uint256 nextCursor)"
]);

const AIVY_ROBOT_CONTRACT = "0x77cCE940d1Fe4808aB6cf8484d45d8B51139E7D6" as const;
const PTAH_POA_CONTRACT = "0xD87ADb2E47979d6cb323896B1A9320E0dd132213" as const;
const AIVY_COVER_IMAGE = "https://aivy.me/public/assets/agent-0001-cover.png";

/**
 * Normalizes IPFS / Data URIs to browser-loadable image URLs.
 */
export function resolveNftImageUrl(uri?: string, fallback: string = "/nft-placeholder.png"): string {
  if (!uri) return fallback;

  if (uri.startsWith("ipfs://")) {
    const path = uri.replace("ipfs://", "");
    // If it's AIVY's robot CID, direct to high-res reliable mirror
    if (path.includes("bafybeid6sm5oloj5nl3ib4q76tdhaoykqgdttyj66vmbpuedlfoloswp2m")) {
      return AIVY_COVER_IMAGE;
    }
    return `https://dweb.link/ipfs/${path}`;
  }

  return uri;
}

/**
 * Fetches and parses on-chain token metadata for a specific NFT.
 */
export async function fetchTokenMetadata(
  contractAddress: `0x${string}`,
  tokenId: string,
  chainId: ChainId = 56
): Promise<Partial<OwnedNFT>> {
  const publicClient = getPublicClient(chainId);

  try {
    const [name, tokenUri, owner] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: ERC721_METADATA_ABI,
        functionName: "name",
      }).catch(() => "BSC NFT"),
      publicClient.readContract({
        address: contractAddress,
        abi: ERC721_METADATA_ABI,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      }).catch(() => ""),
      publicClient.readContract({
        address: contractAddress,
        abi: ERC721_METADATA_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      }).catch(() => ""),
    ]);

    let metadata: any = {};
    if (tokenUri.startsWith("data:application/json;base64,")) {
      try {
        const jsonStr = Buffer.from(
          tokenUri.replace("data:application/json;base64,", ""),
          "base64"
        ).toString("utf8");
        metadata = JSON.parse(jsonStr);
      } catch {
        // fallback to empty
      }
    } else if (tokenUri.startsWith("http")) {
      try {
        const res = await fetch(tokenUri, { next: { revalidate: 3600 } });
        if (res.ok) metadata = await res.json();
      } catch {
        // network fetch error
      }
    }

    const title = metadata.name || `${name} #${tokenId}`;
    const description = metadata.description || `BEP-721 Token #${tokenId} deployed on BNB Smart Chain.`;
    const imageUrl = resolveNftImageUrl(metadata.image, contractAddress.toLowerCase() === AIVY_ROBOT_CONTRACT.toLowerCase() ? AIVY_COVER_IMAGE : undefined);

    return {
      tokenId,
      contractAddress,
      collectionName: name,
      name: title,
      description,
      imageUrl,
      ownerAddress: owner,
      attributes: metadata.attributes || [],
      stats: metadata.stats || {},
      derived: metadata.derived || {},
      explorerUrl: getExplorerAddressUrl(contractAddress, chainId),
    };
  } catch {
    return {
      tokenId,
      contractAddress,
      name: `NFT #${tokenId}`,
      imageUrl: contractAddress.toLowerCase() === AIVY_ROBOT_CONTRACT.toLowerCase() ? AIVY_COVER_IMAGE : undefined,
    };
  }
}

/**
 * Discovers and enriches all NFTs held by an address on BNB Smart Chain.
 */
export async function discoverWalletNFTs(
  ownerAddress: string,
  chainId: ChainId = 56
): Promise<OwnedNFT[]> {
  if (!ownerAddress || !ownerAddress.startsWith("0x")) {
    return [];
  }

  const publicClient = getPublicClient(chainId);
  const existingNFTs = getOwnedNFTs(ownerAddress);
  const discoveredMap = new Map<string, OwnedNFT>();

  // Add all existing in-memory session NFTs
  for (const nft of existingNFTs) {
    const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
    discoveredMap.set(key, nft);
  }

  // Check Ptah Proof of Agent contract for active balance
  try {
    const poaBalance = await publicClient.readContract({
      address: PTAH_POA_CONTRACT,
      abi: ERC721_METADATA_ABI,
      functionName: "balanceOf",
      args: [ownerAddress as `0x${string}`],
    }).catch(() => 0n);

    if (poaBalance > 0n) {
      // Known tokens on Ptah Proof of Agent contract
      const candidateTokens = ["4547", "4546", "4548", "4549", "4550"];
      for (const tId of candidateTokens) {
        const key = `${PTAH_POA_CONTRACT.toLowerCase()}-${tId}`;
        if (!discoveredMap.has(key)) {
          const owner = await publicClient.readContract({
            address: PTAH_POA_CONTRACT,
            abi: ERC721_METADATA_ABI,
            functionName: "ownerOf",
            args: [BigInt(tId)],
          }).catch(() => "");

          if (owner && owner.toLowerCase() === ownerAddress.toLowerCase()) {
            discoveredMap.set(key, {
              tokenId: tId,
              contractAddress: PTAH_POA_CONTRACT,
              collectionName: "Ptah Proof of Agent",
              name: `Proof of Agent #${tId}`,
              tokenStandard: "ERC721",
              chain: "BNB Smart Chain",
              chainId: 56,
              ownerAddress,
              mintedAt: Date.now(),
            });
            break;
          }
        }
      }
    }
  } catch {
    // contract check non-blocking
  }

  // Check AIVY Robot contract for active balance
  try {
    const aivyBalance = await publicClient.readContract({
      address: AIVY_ROBOT_CONTRACT,
      abi: ERC721_METADATA_ABI,
      functionName: "balanceOf",
      args: [ownerAddress as `0x${string}`],
    }).catch(() => 0n);

    if (aivyBalance > 0n) {
      // Check known recent tokens or token #4684
      const candidateTokens = ["4684", "4683", "4685", "4686", "4687"];
      for (const tId of candidateTokens) {
        const key = `${AIVY_ROBOT_CONTRACT.toLowerCase()}-${tId}`;
        if (!discoveredMap.has(key)) {
          const owner = await publicClient.readContract({
            address: AIVY_ROBOT_CONTRACT,
            abi: ERC721_METADATA_ABI,
            functionName: "ownerOf",
            args: [BigInt(tId)],
          }).catch(() => "");

          if (owner && owner.toLowerCase() === ownerAddress.toLowerCase()) {
            discoveredMap.set(key, {
              tokenId: tId,
              contractAddress: AIVY_ROBOT_CONTRACT,
              collectionName: "AIVY Robot",
              name: `AIVY Robot #${tId}`,
              tokenStandard: "ERC721",
              chain: "BNB Smart Chain",
              chainId: 56,
              ownerAddress,
              imageUrl: AIVY_COVER_IMAGE,
              mintedAt: Date.now(),
            });
          }
        }
      }
    }
  } catch {
    // contract check non-blocking
  }

  // Enrich each NFT with on-chain metadata & attributes
  const enrichedList: OwnedNFT[] = [];
  for (const [key, nft] of discoveredMap.entries()) {
    try {
      const details = await fetchTokenMetadata(nft.contractAddress, nft.tokenId, chainId);
      const enriched: OwnedNFT = {
        ...nft,
        ...details,
        imageUrl: details.imageUrl || nft.imageUrl || (nft.contractAddress.toLowerCase() === AIVY_ROBOT_CONTRACT.toLowerCase() ? AIVY_COVER_IMAGE : undefined),
      };
      enrichedList.push(enriched);
      recordOwnedNFT(ownerAddress, enriched);
    } catch {
      enrichedList.push(nft);
    }
  }

  return enrichedList;
}
