import {
  WalletStatusResponse,
  PairingSessionResponse,
  VerifyPairingResponse,
  WalletSettingsResponse,
  ContractCallPreviewParams,
  ContractCallPreviewResult,
  ContractCallExecuteResult,
} from "./types";

export interface IBinanceAgenticWalletProvider {
  readonly name: string;
  readonly isDevelopmentMode: boolean;

  getWalletStatus(): Promise<WalletStatusResponse>;
  createPairingSession(): Promise<PairingSessionResponse>;
  verifyPairing(qrCodeId: string): Promise<VerifyPairingResponse>;
  disconnect(): Promise<void>;
  getSettings(): Promise<WalletSettingsResponse>;
  previewContractCall(params: ContractCallPreviewParams): Promise<ContractCallPreviewResult>;
  executeContractCall(requestId: string): Promise<ContractCallExecuteResult>;
}
