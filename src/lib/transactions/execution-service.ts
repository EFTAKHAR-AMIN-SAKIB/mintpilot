import { ExecutionResult } from "@/types";
import { getWalletProvider } from "@/lib/wallet/factory";
import {
  getActivePreview,
  clearActivePreview,
  setSessionExecuting,
  isSessionExecuting,
  setLastExecution,
} from "@/lib/session/store";
import { getExplorerTxUrl } from "@/lib/network/config";

export interface ExecuteTransactionInput {
  sessionId: string;
  previewId: string;
  walletRequestId: string;
}

export async function executeConfirmedTransaction(
  input: ExecuteTransactionInput
): Promise<ExecutionResult> {
  const { sessionId, previewId, walletRequestId } = input;

  // 1. Guard against concurrent / duplicate submission
  if (isSessionExecuting(sessionId)) {
    throw new Error("A transaction execution is already in progress for this session. Please wait.");
  }

  // 2. Retrieve active preview from session
  const activePreview = getActivePreview(sessionId);
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

    if (executeResult.status === "PENDING_CONFIRMATION") {
      status = "PENDING_CONFIRMATION";
      requiresAppApproval = true;
    } else if (executeResult.status === "FAILED") {
      status = "FAILED";
    }

    const txHash = executeResult.txHash;
    const explorerUrl = txHash ? getExplorerTxUrl(txHash, activePreview.chainId) : undefined;

    const finalResult: ExecutionResult = {
      previewId,
      status,
      txHash,
      explorerUrl,
      requiresAppApproval,
      errorMessage: executeResult.errorMessage,
      timestamp: Date.now(),
    };

    // Store last execution and clear active preview to prevent reuse
    setLastExecution(sessionId, finalResult);
    clearActivePreview(sessionId);

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
