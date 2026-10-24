import { getPublicClient } from "@/lib/network/rpc-client";
import { getExplorerTxUrl } from "@/lib/network/config";
import { ChainId } from "@/types";

export interface TransactionStatusReport {
  txHash: `0x${string}`;
  status: "CONFIRMED" | "PENDING" | "REVERTED" | "NOT_FOUND";
  blockNumber?: number;
  gasUsed?: string;
  tokenId?: string;
  explorerUrl: string;
  error?: string;
}

export async function checkTransactionOnChainStatus(
  txHash: `0x${string}`,
  chainId: ChainId = 56
): Promise<TransactionStatusReport> {
  const explorerUrl = getExplorerTxUrl(txHash, chainId);

  // If this is a mock tx from Development Mode
  if (txHash.startsWith("0x") && txHash.length === 66 && process.env.DEMO_MODE === "true") {
    return {
      txHash,
      status: "CONFIRMED",
      blockNumber: 42918230,
      gasUsed: "94520",
      tokenId: "42",
      explorerUrl,
    };
  }

  const client = getPublicClient(chainId);

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    if (!receipt) {
      return {
        txHash,
        status: "PENDING",
        explorerUrl,
      };
    }

    const isSuccess = receipt.status === "success";

    // Attempt to extract minted Token ID from Transfer event (topic[0] == Transfer, topic[3] == tokenId for ERC721)
    let tokenId: string | undefined;
    const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    for (const log of receipt.logs) {
      if (log.topics[0] === TRANSFER_TOPIC && log.topics[3]) {
        try {
          tokenId = BigInt(log.topics[3]).toString();
          break;
        } catch {
          // ignore
        }
      }
    }

    return {
      txHash,
      status: isSuccess ? "CONFIRMED" : "REVERTED",
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      tokenId,
      explorerUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("could not be found") || msg.includes("TransactionReceiptNotFoundError")) {
      return {
        txHash,
        status: "PENDING",
        explorerUrl,
      };
    }
    return {
      txHash,
      status: "PENDING",
      explorerUrl,
      error: msg,
    };
  }
}
