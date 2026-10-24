import { NextRequest, NextResponse } from "next/server";
import { getWalletProvider } from "@/lib/wallet/factory";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { updateSessionWallet, getOrCreateSession } from "@/lib/session/store";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const rateLimit = checkRateLimit(`status-${sessionId}`, 60, 60000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const provider = getWalletProvider();

  try {
    const status = await provider.getWalletStatus();
    const defaultSettings = { devModeEnabled: false, dailySpendingLimitUsd: undefined, remainingQuotaUsd: undefined };
    const settings = await provider.getSettings().catch(() => defaultSettings);

    const updated = updateSessionWallet(sessionId, {
      status: status.status,
      address: status.address,
      binanceChainId: status.binanceChainId,
      isDevMode: settings.devModeEnabled,
      isDevelopmentProvider: provider.isDevelopmentMode,
      dailySpendingLimit: {
        totalLimitUsd: settings.dailySpendingLimitUsd,
        remainingQuotaUsd: settings.remainingQuotaUsd,
        currency: "USD",
      },
    });

    return NextResponse.json({
      success: true,
      wallet: updated.walletInfo,
      providerName: provider.name,
      isDevelopmentMode: provider.isDevelopmentMode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
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
