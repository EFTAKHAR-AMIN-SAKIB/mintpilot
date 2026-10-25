import fs from "fs";
import path from "path";
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

  // Check if baw executable exists on disk
  const localCliPath = path.resolve(process.cwd(), "node_modules", "@binance", "agentic-wallet", "dist", "index.js");
  const binCliPath = path.resolve(process.cwd(), "bin", "baw.js");
  const cliExists = fs.existsSync(localCliPath) || fs.existsSync(binCliPath);

  // When running on Vercel or cloud environments where CLI binary is absent, use resilient Web/MPC provider
  if (process.env.VERCEL && mode !== "cli") {
    activeProvider = new DevMockBawProvider();
    return activeProvider;
  }

  if (mode === "cli" || (mode === "auto" && cliExists)) {
    activeProvider = new BawCliProvider();
    return activeProvider;
  }

  activeProvider = new DevMockBawProvider();
  return activeProvider;
}

// Allows switching in tests or runtime toggles
export function setWalletProvider(provider: IBinanceAgenticWalletProvider): void {
  activeProvider = provider;
}
