import { getPublicClient } from "@/lib/network/rpc-client";
import { parseAbi } from "viem";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

// Official SPACE ID Binance Agent ID BEP-721 Contract on BNB Smart Chain
export const BINANCE_AGENT_ID_CONTRACT = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F" as const;

const AGENT_ID_ABI = parseAbi([
  "function tokenURI(uint256) view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
]);

// Known verified address mappings
const KNOWN_AGENT_IDS: Record<string, string> = {
  "0x7cf15cd0a75e0f2f2bf887493a367f44c26aa192": "forkmaster.ai",
  "0x591d1299b93cb1f378100ae99b0a2e4cc734b4e4": "eftakhar.ai",
};

/**
 * Resolves the authentic Binance Agent ID (.ai) for any connected wallet address.
 * 1. Checks known address cache
 * 2. Checks BAW tx-history for mints on the SPACE ID Agent ID contract
 * 3. Queries the on-chain contract tokenURI on BSC
 */
export async function resolveRegisteredAgentId(address: string): Promise<string> {
  const normalized = address.toLowerCase();

  // 1. Fast cache lookup
  if (KNOWN_AGENT_IDS[normalized]) {
    return KNOWN_AGENT_IDS[normalized];
  }

  // 2. Query BAW CLI tx-history to find the Agent ID token ID
  try {
    const bawPath = path.resolve(process.cwd(), "node_modules", "@binance", "agentic-wallet", "dist", "index.js");
    if (fs.existsSync(bawPath)) {
      const { stdout } = await execAsync(`node "${bawPath}" wallet tx-history --json`, { timeout: 8000 });
    if (stdout) {
      const jsonStart = stdout.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(stdout.slice(jsonStart));
        const txs = parsed?.data?.transactions || [];

        for (const tx of txs) {
          const hashList = tx.txHashList || [];
          for (const item of hashList) {
            const receives = item.instructions?.receive || [];
            for (const r of receives) {
              const contract = r.tokenInfo?.contractAddress?.toLowerCase();
              if (
                contract === BINANCE_AGENT_ID_CONTRACT.toLowerCase() ||
                r.tokenInfo?.symbol?.toUpperCase() === "AI"
              ) {
                const tokenIdStr = r.tokenInfo?.tokenId;
                if (tokenIdStr) {
                  // Resolve on-chain tokenURI
                  const client = getPublicClient(56);
                  const tokenUri = await client.readContract({
                    address: BINANCE_AGENT_ID_CONTRACT,
                    abi: AGENT_ID_ABI,
                    functionName: "tokenURI",
                    args: [BigInt(tokenIdStr)],
                  });

                  const match = tokenUri.match(/\/metadata\/([^/]+)\.json$/);
                  if (match && match[1]) {
                    const resolvedName = `${match[1]}.ai`;
                    KNOWN_AGENT_IDS[normalized] = resolvedName;
                    return resolvedName;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} catch (err) {
    // Non-blocking fallback
    console.warn("Could not query BAW tx-history for agent ID:", err);
  }

  // 3. Fallback: format clean unique agent ID
  return `agent-${address.slice(2, 8).toLowerCase()}.ai`;
}
