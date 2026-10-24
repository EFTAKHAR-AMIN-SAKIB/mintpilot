import { describe, it, expect } from "vitest";
import { parseIntentDeterministic } from "@/lib/ai/gemini";
import { parsedIntentSchema } from "@/lib/ai/intent-schema";

describe("MintPilot Intent Parsing", () => {
  it("should parse a complete mint request with URL, quantity, and price", () => {
    const prompt = "Mint 1 NFT from https://example.com/mint for 0.01 BNB";
    const result = parseIntentDeterministic(prompt);

    expect(result.intentType).toBe("mint_nft");
    expect(result.chain).toBe("bsc");
    expect(result.sourceUrl).toBe("https://example.com/mint");
    expect(result.quantity).toBe(1);
    expect(result.maximumMintPrice).toBe("0.01");
    expect(result.currency).toBe("BNB");
    expect(result.requiresResolution).toBe(true);

    const validated = parsedIntentSchema.safeParse(result);
    expect(validated.success).toBe(true);
  });

  it("should correctly parse quantity of 3 NFTs with BNB price", () => {
    const prompt = "Mint 3 NFTs from https://pixelgarden.io for 0.05 BNB";
    const result = parseIntentDeterministic(prompt);

    expect(result.quantity).toBe(3);
    expect(result.maximumMintPrice).toBe("0.05");
    expect(result.sourceUrl).toBe("https://pixelgarden.io");
  });

  it("should extract direct contract address when provided in prompt", () => {
    const prompt = "Mint an NFT from 0x1234567890123456789012345678901234567890 for 0.02 BNB";
    const result = parseIntentDeterministic(prompt);

    expect(result.contractAddress).toBe("0x1234567890123456789012345678901234567890");
    expect(result.maximumMintPrice).toBe("0.02");
    expect(result.requiresResolution).toBe(true);
  });

  it("should trigger clarification when collection or URL is missing", () => {
    const prompt = "I want to mint an NFT please";
    const result = parseIntentDeterministic(prompt);

    expect(result.intentType).toBe("clarification_needed");
    expect(result.missingInformation).toContain("sourceUrl_or_collection");
    expect(result.clarificationQuestion).toBeTruthy();
    expect(result.requiresResolution).toBe(false);
  });

  it("should recognize educational/informational queries", () => {
    const prompt = "Explain how NFT minting works on BNB Chain";
    const result = parseIntentDeterministic(prompt);

    expect(result.intentType).toBe("informational");
    expect(result.requiresResolution).toBe(false);
  });

  it("should detect bsc_testnet when specified in prompt", () => {
    const prompt = "Mint 1 NFT from https://testnet.pixelgarden.io on testnet for 0.005 BNB";
    const result = parseIntentDeterministic(prompt);

    expect(result.chain).toBe("bsc_testnet");
  });

  it("should validate intent against Zod schema and reject malformed data", () => {
    const malformed = {
      intentType: "invalid_type",
      quantity: -5,
      contractAddress: "not-an-address",
    };
    const check = parsedIntentSchema.safeParse(malformed);
    expect(check.success).toBe(false);
  });
});
