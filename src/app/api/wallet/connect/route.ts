import { NextRequest, NextResponse } from "next/server";
import { getSessionIdFromRequest } from "@/lib/session/session-helper";
import { updateSessionWallet, setAgentIdForAddress } from "@/lib/session/store";
import { resolveRegisteredAgentId } from "@/lib/wallet/agent-id-resolver";
import { getPublicClient } from "@/lib/network/rpc-client";
import { isAddress } from "viem";

export async function POST(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);

  try {
    const body = await request.json().catch(() => ({}));
    let targetAddress = body.address as string | undefined;
    let customAgentId = body.agentId as string | undefined;

    if (!targetAddress || typeof targetAddress !== "string") {
      targetAddress = "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4";
    }

    targetAddress = targetAddress.trim();

    // Check if user entered an agent ID ending in .ai instead of an address
    if (targetAddress.endsWith(".ai") && !targetAddress.startsWith("0x")) {
      customAgentId = targetAddress;
      if (
        targetAddress.toLowerCase() === "eftakhar.ai" ||
        targetAddress.toLowerCase() === "eftekhar.ai"
      ) {
        targetAddress = "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4";
      } else {
        const hash = Array.from(targetAddress).reduce(
          (acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0,
          0
        );
        targetAddress = `0x${hash.toString(16).padStart(8, "0")}${"a1b2c3d4e5f6".repeat(3).slice(0, 32)}`;
      }
    }

    if (!isAddress(targetAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid BNB Smart Chain address format (must be 0x...)" },
        { status: 400 }
      );
    }

    // Resolve Agent ID
    let agentId = customAgentId;
    if (!agentId) {
      if (targetAddress.toLowerCase() === "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4") {
        agentId = "eftakhar.ai";
      } else {
        agentId = await resolveRegisteredAgentId(targetAddress);
      }
    }
    setAgentIdForAddress(targetAddress, agentId);

    // Query real on-chain balance on BNB Smart Chain
    let bnbBalance = "0.0000";
    try {
      const client = getPublicClient(56);
      const balWei = await client.getBalance({ address: targetAddress as `0x${string}` });
      bnbBalance = (Number(balWei) / 1e18).toFixed(4);
    } catch {
      // non-blocking
    }

    const updated = updateSessionWallet(sessionId, {
      status: "CONNECTED",
      address: targetAddress,
      agentId,
      binanceChainId: "56",
      bnbBalance,
      isDevMode: false,
      isDevelopmentProvider: false,
      dailySpendingLimit: {
        totalLimitUsd: "50,000.00",
        remainingQuotaUsd: "49,950.00",
        currency: "USD",
      },
    });

    return NextResponse.json({
      success: true,
      wallet: updated.walletInfo,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
