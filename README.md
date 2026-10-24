# MintPilot 🧭
### *“Your intent. Your wallet. Your choice.”*

An Apple-inspired, natural-language Web3 application for NFT minting on **BNB Smart Chain** using **Binance Agentic Wallet** and **Google Gemini**.

MintPilot turns blockchain interactions into a calm, intuitive experience that feels like messaging an AI assistant—while strictly enforcing that **AI interprets intent, verified application logic enforces rules, Binance Agentic Wallet handles secure wallet operations, and the user authorizes each transaction.**

---

## 🌟 Key Features

1. **Natural-Language Understanding with Google Gemini**:
   - Converts natural requests like *"Mint 1 NFT from Pixel Garden for 0.01 BNB"* into validated structured intent schemas.
   - Built with the official `@google/genai` SDK and validated at runtime via Zod.
   - Includes a deterministic, offline-capable fallback parser for local development without an API key.

2. **Official Binance Agentic Wallet Integration**:
   - Integrated with `@binance/agentic-wallet` and the official `baw` CLI.
   - Real QR pairing code generation (`baw auth signin --json`) and verification (`baw auth verify`).
   - Two-step safety protocol for external contract calls (`contract-call preview` $\rightarrow$ explicit confirmation $\rightarrow$ `contract-call execute`).
   - Clearly labeled **Development Mode Adapter** that simulates pairing and execution without risking real BNB funds or requiring physical phone scanning.

3. **Safe NFT Collection Resolution**:
   - Anti-SSRF URL validator that blocks private IP ranges, cloud metadata (169.254.169.254), loopback addresses, and DNS rebinding attacks.
   - HTML sanitization and prompt-injection detection to neutralize malicious instructions embedded in scraped mint sites.
   - Verified ABI inspection using viem to confirm smart contract bytecode, interfaces (ERC-721/ERC-1155), and payable status.

4. **Strict Two-Step Confirmation State Machine**:
   - **Step 1 (Preview)**: Builds candidate transaction, calls wallet preview, decodes calldata, and presents verified collection, exact mint price, estimated gas, and risk flags.
   - **Step 2 (Execute)**: Verifies user session, preview expiration, and request ID. Execution is strictly idempotent and prevents double-submission.
   - Exact `BigInt` Wei calculations (1 BNB = $10^{18}$ Wei) without floating-point inaccuracies.

5. **Apple-Inspired Design Language**:
   - Minimalist, calm interface with generous whitespace, crisp typography, and soft off-white surfaces (`#f5f5f7`).
   - Subtle shadows, delicate borders, restrained Apple-blue accents (`#0071e3`), and smooth transitions.
   - Full dark mode support (`#000000` / `#1c1c1e`).
   - Real-time audit activity drawer tracking session events.

---

## 🏗️ Architecture

```
                                  [ User Input ]
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │ Google Gemini (GenAI)  │
                            │  Structured Intent     │
                            └────────────┬───────────┘
                                         │
                                         ▼
                   ┌───────────────────────────────────────────┐
                   │ Collection Resolver & Contract Inspector  │
                   │  - Anti-SSRF Protection                   │
                   │  - HTML Sanitizer & Prompt Injection Guard│
                   │  - Bytecode & ERC-721 ABI Validator       │
                   └─────────────────────┬─────────────────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  Verification Card     │
                            │ (User inspects details)│
                            └────────────┬───────────┘
                                         │
                                         ▼
                   ┌───────────────────────────────────────────┐
                   │ Binance Agentic Wallet: contract-call     │
                   │               --preview                   │
                   └─────────────────────┬─────────────────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │ Transaction Preview    │
                            │   (Awaiting approval)  │
                            └────────────┬───────────┘
                                         │
                                         ▼
                            [ Explicit Confirmation ]
                                         │
                                         ▼
                   ┌───────────────────────────────────────────┐
                   │ Binance Agentic Wallet: contract-call     │
                   │               --execute                   │
                   └─────────────────────┬─────────────────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  Confirmed on BNB Chain │
                            │     (BscScan Link)     │
                            └────────────────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 18.0.0 or higher (Node 20+ / 22+ recommended)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/your-username/mintpilot.git
cd mintpilot
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your settings:
```ini
# Google Gemini API Key (optional for development; fallback parser is enabled by default)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Binance Agentic Wallet Mode: "auto", "cli", or "dev"
BINANCE_AGENTIC_WALLET_MODE=auto

# Production safety flag:
DEMO_MODE=false

# BNB Smart Chain network configuration:
CHAIN_MODE=mainnet
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

MintPilot includes automated test suites covering intent parsing, anti-SSRF protections, NFT collection resolution, wallet adapters, and the transaction confirmation state machine.

To run the full test suite:
```bash
npm test
```

Test coverage:
- **`tests/intent.test.ts`**: Complete intent parsing, quantities, price extraction, clarification triggering, and Zod validation.
- **`tests/ssrf.test.ts`**: Private IP detection (10.x, 192.168.x, 172.16.x, loopback, AWS metadata 169.254.169.254), protocol enforcement, HTML sanitization, and prompt injection detection.
- **`tests/resolver.test.ts`**: Resolution of curated collections (Pixel Garden, PancakeSquad), direct contract addresses, and network fallbacks.
- **`tests/transactions.test.ts`**: Exact `BigInt` Wei calculations, calldata encoding, preview generation, expiration prevention, and double-execution guards.
- **`tests/wallet.test.ts`**: Binance Agentic Wallet CLI and Development Mode adapters, QR code generation, session verification, and spending limits.

---

## 🔐 Binance Agentic Wallet Integration Details

MintPilot implements the official `@binance/agentic-wallet` specification:

1. **Authentication Flow**:
   - `POST /api/wallet/session` runs `baw auth signin --json` to generate `qrCodeId`, `pairingCode`, and `urlForWeb`.
   - The user scans the QR code in the Binance mobile app.
   - `POST /api/wallet/poll` polls `baw auth verify --qrCodeId <id> --json` until the user authorizes the connection.

2. **Developer Mode Requirement**:
   - Per Binance documentation (`references/external-sign.md`), external contract calls require **Developer Mode** to be enabled in the Binance App (`baw wallet settings --json` $\rightarrow$ `devMode.enabled === true`).
   - MintPilot queries and displays this setting in the wallet status modal.

3. **Two-Step External Signing Protocol**:
   - **Preview**: `baw contract-call preview --binanceChainId 56 --from <addr> --to <contract> --value <wei> --inputData <hex> --json`
     - Validates calldata and returns `requestId`, `parsedTx`, `estimatedGas`, and `potentialRisks`.
   - **Execute**: `baw contract-call execute --requestId <id> --json`
     - Executes only the exact previewed request and returns `txHash` or triggers an app authorization prompt (`PENDING_CONFIRMATION`).

4. **Development Mode Provider**:
   - When running locally without active Binance app credentials or test tokens, MintPilot seamlessly switches to a clearly labeled **Development Mode** provider.
   - It generates realistic QR codes, simulates pairing, and encodes authentic calldata using `viem`—clearly disclosing simulated actions to the user so that mock behavior is never misrepresented as live on-chain transactions.

---

## 📚 Official References

- **Binance Agentic Wallet Documentation**:  
  https://developers.binance.com/en/docs/products/agentic-wallet/welcome
- **Binance Skills Hub — External Sign Reference**:  
  https://github.com/binance/binance-skills-hub/blob/main/skills/binance-web3/binance-agentic-wallet/references/external-sign.md
- **Binance Skills Hub — Authentication Reference**:  
  https://github.com/binance/binance-skills-hub/blob/main/skills/binance-web3/binance-agentic-wallet/references/authentication.md
- **Google Gemini Structured Output**:  
  https://ai.google.dev/gemini-api/docs/structured-output
- **Google Gemini Function Calling**:  
  https://ai.google.dev/gemini-api/docs/function-calling

---

## 📄 License

MIT License. Designed and built for the BNB Smart Chain and Binance Agentic Wallet ecosystem.
