import { GoogleGenAI } from "@google/genai";
import { ParsedIntent } from "@/types";
import { parsedIntentSchema } from "./intent-schema";

const GEMINI_SYSTEM_INSTRUCTION = `
You are the MintPilot Natural Language Understanding Engine.
MintPilot is an Apple-inspired Web3 application allowing users to mint NFTs on BNB Smart Chain using Binance Agentic Wallet.

Your job is strictly to extract user intent into a validated structured JSON object.
Core rules:
1. Never invent or hallucinate contract addresses.
2. If the user provides a website URL, extract it into 'sourceUrl'.
3. Default chain to 'bsc' (BNB Smart Chain) unless 'bsc_testnet' is explicitly requested.
4. Extract requested quantity (default to 1 if unspecified).
5. Extract maximum acceptable mint price in BNB as a decimal string (e.g., "0.01"). Do not convert to wei; application logic will handle wei conversion.
6. Set 'currency' to 'BNB'.
7. If the request is ambiguous (e.g. "mint an NFT" without a website, name, or contract), set 'intentType' to 'clarification_needed' and formulate a friendly 'clarificationQuestion'.
8. If the user is asking an educational or general question (e.g., "Explain how NFT minting works"), set 'intentType' to 'informational'.
9. If the user provides a collection name or URL, set 'requiresResolution' to true so the resolver can inspect official sources.

Output JSON ONLY with the following schema:
{
  "intentType": "mint_nft" | "informational" | "clarification_needed" | "unknown",
  "chain": "bsc" | "bsc_testnet" | null,
  "collectionName": string | null,
  "sourceUrl": string | null,
  "contractAddress": string | null,
  "quantity": number,
  "maximumMintPrice": string | null,
  "currency": "BNB",
  "tokenStandard": "ERC721" | "ERC1155" | null,
  "functionName": string | null,
  "arguments": [],
  "missingInformation": string[],
  "clarificationQuestion": string | null,
  "requiresResolution": boolean,
  "confidenceNotes": string
}
`;

/**
 * Fallback deterministic rule-based intent parser when GEMINI_API_KEY is not configured
 */
export function parseIntentDeterministic(prompt: string): ParsedIntent {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // Informational requests
  if (
    lower.startsWith("explain") ||
    lower.includes("how does") ||
    lower.includes("what is an nft") ||
    lower.includes("how to mint")
  ) {
    return {
      intentType: "informational",
      chain: "bsc",
      collectionName: null,
      sourceUrl: null,
      contractAddress: null,
      quantity: 1,
      maximumMintPrice: null,
      currency: "BNB",
      tokenStandard: null,
      functionName: null,
      arguments: [],
      missingInformation: [],
      clarificationQuestion: null,
      requiresResolution: false,
      confidenceNotes: "Informational query handled by assistant knowledge base.",
    };
  }

  // Extract URL
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  const sourceUrl = urlMatch ? urlMatch[0] : null;

  // Extract contract address (0x + 40 hex chars)
  const addressMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  const contractAddress = addressMatch ? (addressMatch[0] as `0x${string}`) : null;

  // Extract quantity
  let quantity = 1;
  const qtyNumMatch = lower.match(/\b(?:mint\s+)?(\d+)\s*(?:nfts?|items?|tokens?)?\b/);
  if (qtyNumMatch && parseInt(qtyNumMatch[1], 10) > 0) {
    quantity = parseInt(qtyNumMatch[1], 10);
  } else if (lower.includes("one nft") || lower.includes("one item")) {
    quantity = 1;
  } else if (lower.includes("two nfts") || lower.includes("two items")) {
    quantity = 2;
  } else if (lower.includes("three nfts") || lower.includes("three items")) {
    quantity = 3;
  }

  // Extract price (e.g., "0.01 BNB", "for 0.05", "0.02bnb", "free")
  let maximumMintPrice: string | null = null;
  if (lower.includes("free") || lower.includes("0 bnb") || lower.includes("zero bnb")) {
    maximumMintPrice = "0";
  } else {
    const priceMatch =
      lower.match(/(?:for|at|price|limit)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:bnb)?/i) ||
      lower.match(/([0-9]+(?:\.[0-9]+)?)\s*bnb/i);
    maximumMintPrice = priceMatch ? priceMatch[1] : null;
  }

  // Extract collection name heuristics
  let collectionName: string | null = null;
  if (!contractAddress && !sourceUrl) {
    const fromMatch = trimmed.match(/(?:from|collection|project)\s+([A-Za-z0-9\s_-]+?)(?:\s+for|\s+at|\s+on|\.|$)/i);
    if (fromMatch && fromMatch[1].trim().length > 1) {
      collectionName = fromMatch[1].trim();
    }
  }

  // Chain selection
  const chain: "bsc" | "bsc_testnet" = lower.includes("testnet") ? "bsc_testnet" : "bsc";

  // Check if mint request
  const isMintIntent = lower.includes("mint") || lower.includes("buy nft") || lower.includes("purchase nft");

  if (!isMintIntent && !sourceUrl && !contractAddress) {
    return {
      intentType: "unknown",
      chain: null,
      collectionName: null,
      sourceUrl: null,
      contractAddress: null,
      quantity: 1,
      maximumMintPrice: null,
      currency: "BNB",
      tokenStandard: null,
      functionName: null,
      arguments: [],
      missingInformation: ["collection_or_url", "intent"],
      clarificationQuestion: "I didn't quite catch that. Would you like to mint an NFT or learn more about how MintPilot works?",
      requiresResolution: false,
    };
  }

  // Check for missing information
  const missingInformation: string[] = [];
  let clarificationQuestion: string | null = null;

  if (!sourceUrl && !contractAddress && !collectionName) {
    missingInformation.push("sourceUrl_or_collection");
    clarificationQuestion = "Which NFT collection or website would you like to mint from? You can paste a URL (e.g., https://example.com/mint) or contract address.";
    return {
      intentType: "clarification_needed",
      chain,
      collectionName: null,
      sourceUrl: null,
      contractAddress: null,
      quantity,
      maximumMintPrice,
      currency: "BNB",
      tokenStandard: null,
      functionName: null,
      arguments: [],
      missingInformation,
      clarificationQuestion,
      requiresResolution: false,
    };
  }

  return {
    intentType: "mint_nft",
    chain,
    collectionName,
    sourceUrl,
    contractAddress,
    quantity,
    maximumMintPrice,
    currency: "BNB",
    tokenStandard: null,
    functionName: null,
    arguments: [],
    missingInformation,
    clarificationQuestion: null,
    requiresResolution: Boolean(sourceUrl || collectionName || contractAddress),
    confidenceNotes: "Parsed via deterministic fallback engine.",
  };
}

/**
 * Primary Intent Parser using official @google/genai SDK with fallback
 */
export async function parseUserIntent(
  prompt: string,
  _history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ParsedIntent> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return parseIntentDeterministic(prompt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    // Set a race timeout of 2500ms to guarantee ultra-fast response even during Google API demand spikes
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini timeout (2.5s limit reached), falling back to fast local parser")), 2500)
    );

    const generatePromise = ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const responseText = typeof response.text === "function" ? (response as any).text() : response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const rawJson = JSON.parse(responseText);
    const validated = parsedIntentSchema.parse(rawJson);

    return {
      ...validated,
      contractAddress: validated.contractAddress as `0x${string}` | null,
      confidenceNotes: "Structured output extracted by Google Gemini.",
    };
  } catch (err: unknown) {
    // Fail safely and use deterministic parser on error
    console.warn("Gemini API call skipped or timed out, using instant parser:", (err as Error).message);
    return parseIntentDeterministic(prompt);
  }
}
