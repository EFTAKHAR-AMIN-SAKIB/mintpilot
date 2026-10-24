import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeConfirmedTransaction } from "@/lib/transactions/execution-service";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { addActivity } from "@/lib/session/store";
import { checkRateLimit } from "@/lib/security/rate-limiter";

const executeRequestSchema = z.object({
  previewId: z.string().min(1),
  walletRequestId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`execute-${sessionId}`, 10, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const json = await request.json();
    const validated = executeRequestSchema.parse(json);

    // Record user confirmation event
    addActivity(sessionId, {
      type: "USER_CONFIRMED",
      title: "User Confirmation Received",
      description: `User authorized execution of preview ${validated.previewId}`,
      details: { ...validated },
    });

    const executionResult = await executeConfirmedTransaction({
      sessionId,
      previewId: validated.previewId,
      walletRequestId: validated.walletRequestId,
    });

    return NextResponse.json({
      success: true,
      execution: executionResult,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
