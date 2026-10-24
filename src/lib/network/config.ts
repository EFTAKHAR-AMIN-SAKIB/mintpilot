import { NetworkConfig, ChainId, ChainMode } from "@/types";

export const BSC_MAINNET: NetworkConfig = {
  id: 56,
  name: "BNB Smart Chain",
  chainMode: "mainnet",
  binanceChainId: "56",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: [
    process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/",
  ],
  blockExplorerUrls: ["https://bscscan.com"],
};

export const BSC_TESTNET: NetworkConfig = {
  id: 97,
  name: "BNB Smart Chain Testnet",
  chainMode: "testnet",
  binanceChainId: "97",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: [
    process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://data-seed-prebsc-2-s1.binance.org:8545/",
  ],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

export function getActiveNetwork(): NetworkConfig {
  const mode = (process.env.CHAIN_MODE || "mainnet").toLowerCase() as ChainMode;
  return mode === "testnet" ? BSC_TESTNET : BSC_MAINNET;
}

export function getNetworkByChainId(chainId: number): NetworkConfig {
  if (chainId === 97) return BSC_TESTNET;
  return BSC_MAINNET;
}

export function getExplorerTxUrl(txHash: string, chainId: number = 56): string {
  const net = getNetworkByChainId(chainId);
  return `${net.blockExplorerUrls[0]}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, chainId: number = 56): string {
  const net = getNetworkByChainId(chainId);
  return `${net.blockExplorerUrls[0]}/address/${address}`;
}
