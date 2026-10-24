import { IBinanceAgenticWalletProvider } from "./provider";
import { BawCliProvider } from "./baw-cli-provider";
import { DevMockBawProvider } from "./dev-mock-provider";

let activeProvider: IBinanceAgenticWalletProvider | null = null;

export function getWalletProvider(): IBinanceAgenticWalletProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const mode = (process.env.BINANCE_AGENTIC_WALLET_MODE || "auto").toLowerCase();
  const isDemo = process.env.DEMO_MODE === "true";

  if (mode === "dev" || isDemo) {
    activeProvider = new DevMockBawProvider();
    return activeProvider;
  }

  if (mode === "cli") {
    activeProvider = new BawCliProvider();
    return activeProvider;
  }

  // "auto": use BawCliProvider by default since @binance/agentic-wallet is installed
  activeProvider = new BawCliProvider();
  return activeProvider;
}

// Allows switching in tests or runtime toggles
export function setWalletProvider(provider: IBinanceAgenticWalletProvider): void {
  activeProvider = provider;
}
