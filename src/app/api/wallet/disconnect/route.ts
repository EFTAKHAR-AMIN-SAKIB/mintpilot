import { NextRequest, NextResponse } from "next/server";
import { getWalletProvider } from "@/lib/wallet/factory";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { updateSessionWallet, clearActivePreview } from "@/lib/session/store";

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const provider = getWalletProvider();

  try {
    await provider.disconnect();
    clearActivePreview(sessionId);
    updateSessionWallet(sessionId, {
      status: "UNCONNECTED",
      address: undefined,
      agentId: "yourname.ai",
      pairingData: undefined,
      bnbBalance: undefined,
    });

    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
