import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveNFTCollection } from "@/lib/nft/collection-resolver";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { addActivity } from "@/lib/session/store";
import { checkRateLimit } from "@/lib/security/rate-limiter";

const resolveRequestSchema = z.object({
  url: z.string().url().nullable().optional(),
  collectionName: z.string().nullable().optional(),
  contractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .nullable()
    .optional(),
  maximumMintPrice: z.string().nullable().optional(),
  chainId: z.union([z.literal(56), z.literal(97)]).optional(),
});

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`resolve-${sessionId}`, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const json = await request.json();
    const validated = resolveRequestSchema.parse(json);

    const candidate = await resolveNFTCollection({
      url: validated.url,
      collectionName: validated.collectionName,
      contractAddress: validated.contractAddress as `0x${string}` | undefined,
      maximumMintPrice: validated.maximumMintPrice,
      chainId: validated.chainId,
    });

    addActivity(sessionId, {
      type: "COLLECTION_RESOLVED",
      title: "Collection Resolved",
      description: `${candidate.collectionName} on ${candidate.chain} (${candidate.contractAddress})`,
      details: { ...candidate },
    });

    return NextResponse.json({
      success: true,
      candidate,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
