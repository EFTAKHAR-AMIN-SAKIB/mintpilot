import { z } from "zod";

export const parsedIntentSchema = z.object({
  intentType: z.enum(["mint_nft", "informational", "clarification_needed", "unknown"]),
  chain: z.enum(["bsc", "bsc_testnet"]).nullable(),
  collectionName: z.string().nullable(),
  sourceUrl: z.string().url().nullable().or(z.literal(null)),
  contractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM contract address format")
    .nullable(),
  quantity: z.number().int().min(1).default(1),
  maximumMintPrice: z.string().nullable(),
  currency: z.literal("BNB").default("BNB"),
  tokenStandard: z.enum(["ERC721", "ERC1155"]).nullable(),
  functionName: z.string().nullable(),
  arguments: z.array(z.unknown()).default([]),
  missingInformation: z.array(z.string()).default([]),
  clarificationQuestion: z.string().nullable(),
  requiresResolution: z.boolean().default(true),
  confidenceNotes: z.string().optional(),
});

export type ParsedIntentFromSchema = z.infer<typeof parsedIntentSchema>;
