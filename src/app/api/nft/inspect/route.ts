import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectContract } from "@/lib/nft/contract-inspector";

const inspectRequestSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.union([z.literal(56), z.literal(97)]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = inspectRequestSchema.parse(json);

    const inspection = await inspectContract(
      validated.contractAddress as `0x${string}`,
      validated.chainId || 56
    );

    return NextResponse.json({
      success: true,
      inspection,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
