import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { getOrCreateSession, recordOwnedNFT, getOwnedNFTs } from "@/lib/session/store";
import { discoverWalletNFTs } from "@/lib/nft/nft-indexer";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { OwnedNFT } from "@/types";

const recordNftSchema = z.object({
  tokenId: z.string().min(1),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  collectionName: z.string(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
  tokenStandard: z.enum(["ERC721", "ERC1155"]).default("ERC721"),
  chain: z.string().default("BNB Smart Chain"),
  chainId: z.number().default(56),
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`nfts-${sessionId}`, 60, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const queryAddress = searchParams.get("address");

  const session = getOrCreateSession(sessionId);
  const targetAddress = queryAddress || session.walletInfo.address;

  if (!targetAddress) {
    return NextResponse.json({
      success: true,
      nfts: [],
      count: 0,
    });
  }

  try {
    const nfts = await discoverWalletNFTs(targetAddress, 56);
    return NextResponse.json({
      success: true,
      nfts,
      count: nfts.length,
      address: targetAddress,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Return any cached NFTs on error
    const cached = getOwnedNFTs(targetAddress);
    return NextResponse.json({
      success: true,
      nfts: cached,
      count: cached.length,
      warning: msg,
    });
  }
}

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  try {
    const json = await request.json();
    const validated = recordNftSchema.parse(json);

    const nft: OwnedNFT = {
      tokenId: validated.tokenId,
      contractAddress: validated.contractAddress as `0x${string}`,
      collectionName: validated.collectionName,
      name: validated.name || `${validated.collectionName} #${validated.tokenId}`,
      imageUrl: validated.imageUrl,
      tokenStandard: validated.tokenStandard,
      chain: validated.chain,
      chainId: validated.chainId,
      txHash: validated.txHash,
      blockNumber: validated.blockNumber,
      mintedAt: Date.now(),
      ownerAddress: validated.ownerAddress,
    };

    recordOwnedNFT(validated.ownerAddress, nft);

    return NextResponse.json({
      success: true,
      nft,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
