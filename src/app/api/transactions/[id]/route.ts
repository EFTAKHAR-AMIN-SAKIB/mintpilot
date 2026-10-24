import { NextRequest, NextResponse } from "next/server";
import { checkTransactionOnChainStatus } from "@/lib/transactions/status-service";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { getSessionActivities, getLastExecution } from "@/lib/session/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = getSessionIdFromRequest(request);

  // If requesting activities
  if (id === "activities" || id === "history") {
    const activities = getSessionActivities(sessionId);
    return NextResponse.json({ success: true, activities });
  }

  // If checking on-chain txHash directly
  if (id.startsWith("0x") && id.length === 66) {
    const chainIdParam = request.nextUrl.searchParams.get("chainId");
    const chainId = chainIdParam === "97" ? 97 : 56;
    const statusReport = await checkTransactionOnChainStatus(id as `0x${string}`, chainId);
    return NextResponse.json({ success: true, statusReport });
  }

  // Otherwise check last execution for previewId
  const lastExec = getLastExecution(sessionId);
  if (lastExec && lastExec.previewId === id) {
    return NextResponse.json({ success: true, execution: lastExec });
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
