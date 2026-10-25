import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/network/rpc-client";

export async function GET() {
  try {
    const client = getPublicClient(56);
    const [gasPriceWei, blockNumber] = await Promise.all([
      client.getGasPrice().catch(() => 50000000n),
      client.getBlockNumber().catch(() => 129545000n),
    ]);

    const gasPriceGwei = (Number(gasPriceWei) / 1e9).toFixed(2);
    // 180k gas units typical for BEP-721 mint
    const estGasWei = 180000n * gasPriceWei;
    const estGasBnb = (Number(estGasWei) / 1e18).toFixed(6);

    return NextResponse.json({
      success: true,
      chainId: 56,
      network: "BNB Smart Chain",
      gasPriceGwei: parseFloat(gasPriceGwei) < 0.01 ? "< 0.01" : gasPriceGwei,
      blockNumber: Number(blockNumber),
      estGasBnb,
      estGasUsd: "< $0.01",
      status: "ONLINE",
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({
      success: true,
      chainId: 56,
      network: "BNB Smart Chain",
      gasPriceGwei: "0.05",
      blockNumber: 129545000,
      estGasBnb: "0.000009",
      estGasUsd: "< $0.01",
      status: "FALLBACK",
      timestamp: Date.now(),
    });
  }
}
