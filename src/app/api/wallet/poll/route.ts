import { NextRequest, NextResponse } from "next/server";
import { getWalletProvider } from "@/lib/wallet/factory";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { updateSessionWallet, getAgentIdForAddress, setAgentIdForAddress } from "@/lib/session/store";
import { resolveRegisteredAgentId } from "@/lib/wallet/agent-id-resolver";

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);

  try {
    const body = await request.json();
    const qrCodeId = body.qrCodeId;

    if (!qrCodeId) {
      return NextResponse.json({ error: "Missing qrCodeId" }, { status: 400 });
    }

    const provider = getWalletProvider();
    let verifyResult = await provider.verifyPairing(qrCodeId);

    // Fallback check: if verifyPairing didn't return CONNECTED, check getWalletStatus directly
    if (verifyResult.status !== "CONNECTED") {
      const statusCheck = await provider.getWalletStatus().catch(() => null);
      if (statusCheck && statusCheck.status === "CONNECTED" && statusCheck.address) {
        verifyResult = {
          status: "CONNECTED",
          address: statusCheck.address,
          binanceChainId: statusCheck.binanceChainId || "56",
        };
      }
    }

    if (verifyResult.status === "CONNECTED") {
      const defaultSettings = { devModeEnabled: false, dailySpendingLimitUsd: undefined, remainingQuotaUsd: undefined };
      const settings = await provider.getSettings().catch(() => defaultSettings);

      let agentId = (verifyResult as any)?.agentId;
      if (!agentId && verifyResult.address) {
        agentId = await resolveRegisteredAgentId(verifyResult.address);
      }
      if (verifyResult.address && agentId) {
        setAgentIdForAddress(verifyResult.address, agentId);
      }

      const updated = updateSessionWallet(sessionId, {
        status: "CONNECTED",
        address: verifyResult.address,
        agentId: agentId || "forkmaster.ai",
        binanceChainId: verifyResult.binanceChainId || "56",
        isDevMode: settings.devModeEnabled,
        dailySpendingLimit: {
          totalLimitUsd: settings.dailySpendingLimitUsd,
          remainingQuotaUsd: settings.remainingQuotaUsd,
        },
      });

      return NextResponse.json({
        success: true,
        status: "CONNECTED",
        wallet: updated.walletInfo,
      });
    }

    return NextResponse.json({
      success: true,
      status: verifyResult.status,
      message: verifyResult.message,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
