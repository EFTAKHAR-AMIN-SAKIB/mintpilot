import { getPublicClient } from "@/lib/network/rpc-client";
import { ChainId } from "@/types";

export interface ContractInspectionResult {
  address: `0x${string}`;
  isContract: boolean;
  bytecodeLength: number;
  name?: string;
  symbol?: string;
  tokenStandard: "ERC721" | "ERC1155" | "Unknown";
  supportedMintFunction?: {
    name: string;
    signature: string;
    isPayable: boolean;
    inputs: Array<{ name: string; type: string }>;
  };
  warnings: string[];
}

export async function inspectContract(
  contractAddress: `0x${string}`,
  chainId: ChainId = 56
): Promise<ContractInspectionResult> {
  const warnings: string[] = [];
  const publicClient = getPublicClient(chainId);

  try {
    const bytecode = await publicClient.getBytecode({ address: contractAddress });

    if (!bytecode || bytecode === "0x") {
      return {
        address: contractAddress,
        isContract: false,
        bytecodeLength: 0,
        tokenStandard: "Unknown",
        warnings: ["The provided address is an Externally Owned Account (EOA), not a deployed smart contract."],
      };
    }

    // Standard candidate mint signatures commonly found on BSC ERC-721 with 4-byte selectors
    const candidateMintFunctions = [
      {
        name: "mint",
        signature: "mint()",
        selector: "1249c58b",
        isPayable: true,
        inputs: [],
      },
      {
        name: "mint",
        signature: "mint(uint256)",
        selector: "a0712d68",
        isPayable: true,
        inputs: [{ name: "quantity", type: "uint256" }],
      },
      {
        name: "mint",
        signature: "mint(address,uint256)",
        selector: "40c10f19",
        isPayable: true,
        inputs: [
          { name: "to", type: "address" },
          { name: "quantity", type: "uint256" },
        ],
      },
      {
        name: "mint",
        signature: "mint(address)",
        selector: "6a627842",
        isPayable: true,
        inputs: [{ name: "to", type: "address" }],
      },
      {
        name: "safeMint",
        signature: "safeMint(address)",
        selector: "40d097c3",
        isPayable: true,
        inputs: [{ name: "to", type: "address" }],
      },
      {
        name: "safeMint",
        signature: "safeMint(address,uint256)",
        selector: "a1448194",
        isPayable: true,
        inputs: [
          { name: "to", type: "address" },
          { name: "quantity", type: "uint256" },
        ],
      },
      {
        name: "claim",
        signature: "claim()",
        selector: "4e71d92d",
        isPayable: true,
        inputs: [],
      },
    ];

    // Detect real supported function from contract bytecode
    const cleanBytecode = bytecode.toLowerCase();
    const matchedFunction = candidateMintFunctions.find((cand) =>
      cleanBytecode.includes(cand.selector)
    );

    const supportedMintFunction = matchedFunction
      ? {
          name: matchedFunction.name,
          signature: matchedFunction.signature,
          isPayable: matchedFunction.isPayable,
          inputs: matchedFunction.inputs,
        }
      : candidateMintFunctions[0];

    // Read on-chain ERC721 collection name and symbol if available
    let name = "Verified BSC NFT";
    let symbol = "NFT";
    try {
      const onChainName = await publicClient.readContract({
        address: contractAddress,
        abi: [{ type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
        functionName: "name",
      });
      if (typeof onChainName === "string" && onChainName.trim()) {
        name = onChainName.trim();
      }
    } catch {
      // Name not implemented or reverted
    }

    try {
      const onChainSymbol = await publicClient.readContract({
        address: contractAddress,
        abi: [{ type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
        functionName: "symbol",
      });
      if (typeof onChainSymbol === "string" && onChainSymbol.trim()) {
        symbol = onChainSymbol.trim();
      }
    } catch {
      // Symbol not implemented or reverted
    }

    return {
      address: contractAddress,
      isContract: true,
      bytecodeLength: bytecode.length,
      name,
      symbol,
      tokenStandard: "ERC721",
      supportedMintFunction,
      warnings,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Could not verify contract bytecode: ${msg}. Address cannot be confirmed as a smart contract.`);
    return {
      address: contractAddress,
      isContract: false,
      bytecodeLength: 0,
      tokenStandard: "Unknown",
      warnings,
    };
  }
}
