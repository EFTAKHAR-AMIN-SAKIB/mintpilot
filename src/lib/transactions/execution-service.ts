import { ExecutionResult } from "@/types";
import { getWalletProvider } from "@/lib/wallet/factory";
import {
  getActivePreview,
  clearActivePreview,
  setSessionExecuting,
  isSessionExecuting,
  setLastExecution,
  recordOwnedNFT,
} from "@/lib/session/store";
import { getExplorerTxUrl } from "@/lib/network/config";
import { getPublicClient } from "@/lib/network/rpc-client";

export interface ExecuteTransactionInput {
  sessionId: string;
  previewId: string;
  walletRequestId: string;
}

const TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_ADDRESS_TOPIC = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function executeConfirmedTransaction(
  input: ExecuteTransactionInput
): Promise<ExecutionResult> {
  const { sessionId, previewId, walletRequestId } = input;

  // 1. Guard against concurrent / duplicate submission
  if (isSessionExecuting(sessionId)) {
    throw new Error("A transaction execution is already in progress for this session. Please wait.");
  }

  // 2. Retrieve active preview from session or previewId cache
  const activePreview = getActivePreview(sessionId, previewId);
  if (!activePreview) {
    throw new Error("No active or unexpired transaction preview found. Please generate a new preview.");
  }

  // 3. Verify previewId and walletRequestId match exactly
  if (activePreview.previewId !== previewId) {
    throw new Error("Preview ID mismatch. The transaction details have changed or expired.");
  }

  if (activePreview.walletRequestId !== walletRequestId) {
    throw new Error("Wallet request ID mismatch. This preview request cannot be executed.");
  }

  // 4. Lock session for execution (idempotency protection)
  setSessionExecuting(sessionId, true);

  try {
    const provider = getWalletProvider();

    // 5. Call wallet execute
    const executeResult = await provider.executeContractCall(walletRequestId);

    let status: ExecutionResult["status"] = "BROADCASTED";
    let requiresAppApproval = false;
    let blockNumber: number | undefined;
    let tokenId: string | undefined;
    let gasUsed: string | undefined;

    if (executeResult.status === "PENDING_CONFIRMATION") {
      status = "PENDING_CONFIRMATION";
      requiresAppApproval = true;
    } else if (executeResult.status === "FAILED") {
      status = "FAILED";
    }

    const txHash = executeResult.txHash;
    const explorerUrl = txHash ? getExplorerTxUrl(txHash, activePreview.chainId) : undefined;

    // 6. If broadcasted with txHash, attempt a quick receipt verification (up to 4s)
    if (txHash && status === "BROADCASTED" && !provider.isDevelopmentMode) {
      try {
        const publicClient = getPublicClient(activePreview.chainId);
        const receipt = await publicClient
          .waitForTransactionReceipt({
            hash: txHash,
            timeout: 4000,
          })
          .catch(() => null);

        if (receipt) {
          blockNumber = Number(receipt.blockNumber);
          gasUsed = receipt.gasUsed.toString();

          if (receipt.status === "reverted") {
            status = "FAILED";
            executeResult.errorMessage = "Transaction reverted on BNB Smart Chain.";
          } else if (receipt.status === "success") {
            status = "CONFIRMED";

            // Inspect logs for ERC721 Transfer(0x0, recipient, tokenId)
            for (const log of receipt.logs) {
              if (
                log.topics[0]?.toLowerCase() === TRANSFER_EVENT_TOPIC.toLowerCase() &&
                log.topics[1]?.toLowerCase() === ZERO_ADDRESS_TOPIC.toLowerCase()
              ) {
                // Token ID is either in topic 3 or data
                if (log.topics[3]) {
                  tokenId = BigInt(log.topics[3]).toString();
                  break;
                }
              }
            }
          }
        }
      } catch {
        // Receipt polling timeout is non-blocking; status remains BROADCASTED
      }
    }

    const finalResult: ExecutionResult = {
      previewId,
      status,
      txHash,
      blockNumber,
      tokenId,
      gasUsed,
      explorerUrl,
      requiresAppApproval,
      errorMessage: executeResult.errorMessage,
      timestamp: Date.now(),
    };

    // If an NFT was confirmed/broadcasted, record it in the wallet vault store
    if (tokenId && (status === "CONFIRMED" || status === "BROADCASTED")) {
      const owner = activePreview.recipientAddress || activePreview.fromAddress;
      recordOwnedNFT(owner, {
        tokenId,
        contractAddress: activePreview.contractAddress,
        collectionName: activePreview.collectionName,
        name: `${activePreview.collectionName} #${tokenId}`,
        tokenStandard: "ERC721",
        chain: activePreview.chain,
        chainId: activePreview.chainId,
        txHash,
        blockNumber,
        mintedAt: Date.now(),
        ownerAddress: owner,
        explorerUrl,
      });
    }

    // Store last execution and clear active preview to prevent reuse
    setLastExecution(sessionId, finalResult);
    clearActivePreview(sessionId);
    setSessionExecuting(sessionId, false);

    return finalResult;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const failureResult: ExecutionResult = {
      previewId,
      status: "FAILED",
      errorMessage: msg,
      timestamp: Date.now(),
    };
    setLastExecution(sessionId, failureResult);
    setSessionExecuting(sessionId, false);
    throw err;
  }
}
