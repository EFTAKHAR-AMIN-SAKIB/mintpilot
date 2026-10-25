import { NextRequest, NextResponse } from "next/server";
import { getWalletProvider } from "@/lib/wallet/factory";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { updateSessionWallet, getOrCreateSession, getAgentIdForAddress, setAgentIdForAddress } from "@/lib/session/store";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { getPublicClient } from "@/lib/network/rpc-client";
import { resolveRegisteredAgentId } from "@/lib/wallet/agent-id-resolver";

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`status-${sessionId}`, 60, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = getOrCreateSession(sessionId);

  // If this session is not connected, return UNCONNECTED state scoped to this session
  if (session.walletInfo.status !== "CONNECTED" || !session.walletInfo.address) {
    return NextResponse.json({
      success: true,
      wallet: {
        status: session.walletInfo.status || "UNCONNECTED",
        agentId: session.walletInfo.agentId || "yourname.ai",
        isDevMode: false,
        isDevelopmentProvider: false,
        pairingData: session.walletInfo.pairingData,
      },
      providerName: "Binance Agentic Wallet",
      isDevelopmentMode: false,
    });
  }

  // If connected, query latest BNB balance on BNB Smart Chain
  let bnbBalance: string | undefined = session.walletInfo.bnbBalance;
  if (session.walletInfo.address) {
    try {
      const client = getPublicClient(56);
      const balWei = await client.getBalance({ address: session.walletInfo.address as `0x${string}` });
      bnbBalance = (Number(balWei) / 1e18).toFixed(4);
    } catch {
      // non-blocking
    }
  }

  const updated = updateSessionWallet(sessionId, {
    bnbBalance,
    agentId: session.walletInfo.agentId || "yourname.ai",
  });

  return NextResponse.json({
    success: true,
    wallet: updated.walletInfo,
    providerName: "Binance Agentic Wallet",
    isDevelopmentMode: false,
  });
}

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`pairing-${sessionId}`, 15, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many pairing requests. Please wait a minute." }, { status: 429 });
  }

  const provider = getWalletProvider();

  try {
    const pairing = await provider.createPairingSession();

    updateSessionWallet(sessionId, {
      status: "PAIRING",
      isDevelopmentProvider: provider.isDevelopmentMode,
      pairingData: {
        qrCodeId: pairing.qrCodeId,
        urlForWeb: pairing.urlForWeb,
        pairingCode: pairing.pairingCode,
        expireAt: pairing.expireAt,
        qrDataUrl: pairing.qrDataUrl,
      },
    });

    return NextResponse.json({
      success: true,
      pairing,
      isDevelopmentMode: provider.isDevelopmentMode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const json = await request.json().catch(() => ({}));
  const { agentId } = json;

  if (typeof agentId === "string" && agentId.trim()) {
    const trimmedId = agentId.trim();
    const currentSession = getOrCreateSession(sessionId);
    if (currentSession.walletInfo.address) {
      setAgentIdForAddress(currentSession.walletInfo.address, trimmedId);
    }
    const updated = updateSessionWallet(sessionId, { agentId: trimmedId });
    return NextResponse.json({ success: true, wallet: updated.walletInfo });
  }

  return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });
}
