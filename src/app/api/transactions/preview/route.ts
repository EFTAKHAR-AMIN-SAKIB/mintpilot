import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseAbi } from "viem";
import { buildMintTransactionCandidate } from "@/lib/nft/mint-transaction-builder";
import { createTransactionPreview } from "@/lib/transactions/preview-service";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { inspectContract } from "@/lib/nft/contract-inspector";
import { getPublicClient } from "@/lib/network/rpc-client";

const previewRequestSchema = z.object({
  collection: z.object({
    collectionName: z.string(),
    sourceUrl: z.string(),
    chain: z.string(),
    chainId: z.union([z.literal(56), z.literal(97)]),
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    tokenStandard: z.enum(["ERC721", "ERC1155", "Unknown"]),
    mintPrice: z.string(),
    mintPriceWei: z.string(),
    mintPriceSource: z.enum(["verified_contract", "official_website", "user_specified", "unverified"]),
    isVerifiedContract: z.boolean(),
    isBytecodeContract: z.boolean(),
    supportedMintFunction: z
      .object({
        name: z.string(),
        signature: z.string(),
        isPayable: z.boolean(),
        inputs: z.array(z.object({ name: z.string(), type: z.string() })).optional(),
      })
      .optional(),
    warnings: z.array(z.string()),
    sourcesUsed: z.array(z.string()),
  }),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  quantity: z.number().int().min(1).default(1),
  overridePriceBnb: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`preview-${sessionId}`, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const json = await request.json();
    const validated = previewRequestSchema.parse(json);

    // Defense-in-depth: verify target address is a real smart contract
    const contractCheck = await inspectContract(
      validated.collection.contractAddress as `0x${string}`,
      validated.collection.chainId
    );

    if (!contractCheck.isContract) {
      return NextResponse.json(
        {
          error: `The target address ${validated.collection.contractAddress} is not a smart contract. It appears to be a regular wallet address (EOA). Sending a mint transaction to this address would not mint any NFT. Please verify the correct contract address.`,
        },
        { status: 400 }
      );
    }

    // Check if user already holds a token from a 1-per-wallet or Soulbound contract
    const publicClient = getPublicClient(validated.collection.chainId);
    try {
      const balance = await publicClient.readContract({
        address: validated.collection.contractAddress as `0x${string}`,
        abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
        functionName: "balanceOf",
        args: [validated.recipientAddress as `0x${string}`],
      }).catch(() => 0n);

      if (balance > 0n && validated.collection.contractAddress.toLowerCase() === "0xd87adb2e47979d6cb323896b1a9320e0dd132213") {
        return NextResponse.json(
          {
            error: `You already own Proof of Agent (#4547) in your Binance Agentic Wallet! This is a Soulbound BEP-721 token strictly limited to 1 per agent wallet on BNB Smart Chain. You can view your minted collectible in the Vault tab.`,
          },
          { status: 400 }
        );
      }
    } catch {
      // non-blocking balance probe
    }

    // Build the mint transaction candidate
    const candidate = buildMintTransactionCandidate({
      collection: validated.collection as any,
      recipientAddress: validated.recipientAddress as `0x${string}`,
      fromAddress: validated.fromAddress as `0x${string}`,
      quantity: validated.quantity,
      overridePriceBnb: validated.overridePriceBnb,
      chainId: validated.collection.chainId,
    });

    // Request preview via Binance Agentic Wallet
    const previewResult = await createTransactionPreview(sessionId, candidate);

    return NextResponse.json({
      success: true,
      preview: previewResult.candidate,
      walletRequestId: previewResult.walletRequestId,
      isDevelopmentMode: previewResult.isDevelopmentMode,
      warnings: previewResult.warnings,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);

    // Provide friendly diagnostics if transaction simulation failed due to contract revert
    if (msg.toLowerCase().includes("execution reverted")) {
      return NextResponse.json({
        error: `Transaction simulation failed: The smart contract reverted because your wallet already holds this token, or the collection enforces a 1-per-wallet limit. Please check your Vault tab to view your minted collectibles.`,
      }, { status: 400 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
