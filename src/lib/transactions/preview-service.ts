import { TransactionCandidate } from "@/types";
import { getWalletProvider } from "@/lib/wallet/factory";
import { setActivePreview } from "@/lib/session/store";

export interface CreatePreviewResult {
  candidate: TransactionCandidate;
  walletRequestId: string;
  isDevelopmentMode: boolean;
  warnings: string[];
}

export async function createTransactionPreview(
  sessionId: string,
  candidate: TransactionCandidate
): Promise<CreatePreviewResult> {
  const provider = getWalletProvider();

  // Call the Binance Agentic Wallet preview API / CLI
  const previewResult = await provider.previewContractCall({
    binanceChainId: String(candidate.chainId),
    from: candidate.fromAddress,
    to: candidate.contractAddress,
    valueWei: candidate.totalValueWei,
    inputData: candidate.calldata,
    gasLimit: candidate.gasLimit,
  });

  if (!previewResult.success || !previewResult.requestId) {
    throw new Error("Wallet preview was rejected or could not generate a valid request ID.");
  }

  // Update candidate with wallet preview response details
  const updatedCandidate: TransactionCandidate = {
    ...candidate,
    walletRequestId: previewResult.requestId,
    estimatedGas: previewResult.estimatedGas || candidate.estimatedGas,
    estimatedGasFeeBnb: previewResult.estimatedGasFeeBnb || candidate.estimatedGasFeeBnb,
    warnings: [
      ...candidate.warnings,
      ...(previewResult.potentialRisks || []),
    ],
    authorityChanges: previewResult.authorityChanges || [],
  };

  // Store in server session state
  setActivePreview(sessionId, updatedCandidate);

  return {
    candidate: updatedCandidate,
    walletRequestId: previewResult.requestId,
    isDevelopmentMode: provider.isDevelopmentMode,
    warnings: updatedCandidate.warnings,
  };
}
