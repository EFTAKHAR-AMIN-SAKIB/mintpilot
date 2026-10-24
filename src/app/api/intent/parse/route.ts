import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseUserIntent } from "@/lib/ai/gemini";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { addActivity } from "@/lib/session/store";
import { checkRateLimit } from "@/lib/security/rate-limiter";

const parseRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`intent-${sessionId}`, 30, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const json = await request.json();
    const validated = parseRequestSchema.parse(json);

    const intent = await parseUserIntent(validated.prompt, validated.history);

    addActivity(sessionId, {
      type: "INTENT_PARSED",
      title: "Intent Interpreted",
      description: `Action: ${intent.intentType} | Collection: ${intent.collectionName || intent.sourceUrl || "N/A"}`,
      details: { ...intent },
    });

    return NextResponse.json({
      success: true,
      intent,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
