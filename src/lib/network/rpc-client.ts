import { createPublicClient, http, PublicClient } from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { getActiveNetwork, BSC_MAINNET, BSC_TESTNET } from "./config";

let mainnetClient: PublicClient | null = null;
let testnetClient: PublicClient | null = null;

export function getPublicClient(chainId?: number): PublicClient {
  const activeNet = chainId ? (chainId === 97 ? BSC_TESTNET : BSC_MAINNET) : getActiveNetwork();

  if (activeNet.id === 97) {
    if (!testnetClient) {
      testnetClient = createPublicClient({
        chain: bscTestnet,
        transport: http(activeNet.rpcUrls[0], {
          timeout: 8000,
          retryCount: 2,
        }),
      });
    }
    return testnetClient;
  }

  if (!mainnetClient) {
    mainnetClient = createPublicClient({
      chain: bsc,
      transport: http(activeNet.rpcUrls[0], {
        timeout: 8000,
        retryCount: 2,
      }),
    });
  }
  return mainnetClient;
}
