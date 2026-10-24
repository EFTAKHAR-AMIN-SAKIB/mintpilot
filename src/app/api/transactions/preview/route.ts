import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildMintTransactionCandidate } from "@/lib/nft/mint-transaction-builder";
import { createTransactionPreview } from "@/lib/transactions/preview-service";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { checkRateLimit } from "@/lib/security/rate-limiter";

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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
