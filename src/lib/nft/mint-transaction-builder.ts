import { encodeFunctionData, parseEther, isAddress } from "viem";
import { TransactionCandidate, NFTCollectionCandidate, ChainId } from "@/types";

export interface BuildMintCandidateInput {
  collection: NFTCollectionCandidate;
  recipientAddress: `0x${string}`;
  fromAddress: `0x${string}`;
  quantity: number;
  overridePriceBnb?: string;
  chainId?: ChainId;
}

const COMMON_MINT_ABIS = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "quantity", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "safeMint",
    stateMutability: "payable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
] as const;

export function buildMintTransactionCandidate(input: BuildMintCandidateInput): TransactionCandidate {
  const { collection, recipientAddress, fromAddress, quantity, overridePriceBnb } = input;

  if (!isAddress(recipientAddress, { strict: false })) {
    throw new Error(`Invalid recipient EVM address: ${recipientAddress}`);
  }
  if (!isAddress(fromAddress, { strict: false })) {
    throw new Error(`Invalid wallet fromAddress: ${fromAddress}`);
  }
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const priceBnb = overridePriceBnb || collection.mintPrice || "0.01";
  
  // BigInt Wei calculations (1 BNB = 10^18 Wei)
  const singlePriceWei = parseEther(priceBnb);
  const totalValueWeiBigInt = singlePriceWei * BigInt(quantity);
  const totalValueWei = totalValueWeiBigInt.toString();
  const totalCostBnb = (Number(totalValueWeiBigInt) / 1e18).toFixed(4);

  // Encode function calldata
  const fnName = collection.supportedMintFunction?.name || "mint";
  const fnSig = collection.supportedMintFunction?.signature || "mint(address)";

  let calldata: `0x${string}` = "0x";
  let args: unknown[] = [];

  try {
    if (fnSig === "mint(address)") {
      args = [recipientAddress];
      calldata = encodeFunctionData({
        abi: COMMON_MINT_ABIS,
        functionName: "mint",
        args: [recipientAddress],
      });
    } else if (fnSig === "mint(address,uint256)") {
      args = [recipientAddress, BigInt(quantity)];
      calldata = encodeFunctionData({
        abi: COMMON_MINT_ABIS,
        functionName: "mint",
        args: [recipientAddress, BigInt(quantity)],
      });
    } else if (fnSig === "mint(uint256)") {
      args = [BigInt(quantity)];
      calldata = encodeFunctionData({
        abi: COMMON_MINT_ABIS,
        functionName: "mint",
        args: [BigInt(quantity)],
      });
    } else if (fnSig === "safeMint(address)") {
      args = [recipientAddress];
      calldata = encodeFunctionData({
        abi: COMMON_MINT_ABIS,
        functionName: "safeMint",
        args: [recipientAddress],
      });
    } else {
      // Default fallback
      args = [recipientAddress];
      calldata = encodeFunctionData({
        abi: COMMON_MINT_ABIS,
        functionName: "mint",
        args: [recipientAddress],
      });
    }
  } catch (err: unknown) {
    throw new Error(`Failed to encode ABI calldata: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Realistic gas estimates for BSC
  const estimatedGasUnits = 95000n;
  const gasPriceGwei = 3n; // BSC standard base gas price is 3 Gwei
  const gasFeeWei = estimatedGasUnits * (gasPriceGwei * 1000000000n);
  const estimatedGasFeeBnb = (Number(gasFeeWei) / 1e18).toFixed(6);

  const estimatedTotalWei = totalValueWeiBigInt + gasFeeWei;
  const estimatedTotalBnb = (Number(estimatedTotalWei) / 1e18).toFixed(6);

  const previewId = `prev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minute expiration

  return {
    previewId,
    action: "NFT Mint",
    collectionName: collection.collectionName,
    chain: collection.chain,
    chainId: collection.chainId || 56,
    contractAddress: collection.contractAddress,
    fromAddress,
    recipientAddress,
    quantity,
    mintPriceBnb: priceBnb,
    totalCostBnb,
    totalValueWei,
    calldata,
    functionName: fnName,
    functionSignature: fnSig,
    arguments: args,
    gasLimit: (estimatedGasUnits + 25000n).toString(),
    estimatedGas: estimatedGasUnits.toString(),
    estimatedGasFeeBnb,
    estimatedTotalBnb,
    warnings: collection.warnings || [],
    authorityChanges: [],
    createdAt: now,
    expiresAt,
  };
}
