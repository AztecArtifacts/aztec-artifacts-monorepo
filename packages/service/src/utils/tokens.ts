import { type ContractArtifact, getContractClassFromArtifact } from '@aztec/aztec.js';
import { FunctionSelector } from '@aztec/stdlib/abi'; // Token standard ABI selectors
// reference: https://forum.aztec.network/t/request-for-comments-aip-20-aztec-token-standard/7737

// Computed with:
// for (const f of artifact.functions) { // and artifact.nonDispatchPublicFunctions
//   const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
//   console.log(`  ${f.name}: '${selector.toString()}',`);
// }

export const tokenAbiFunctionSelectors = {
  balance_of_private: '0x4375727c',
  transfer_private_to_commitment: '0x638d3f00',
  transfer_private_to_private: '0xedc09d49',
  transfer_private_to_public: '0xaf28c76f',
  transfer_private_to_public_with_commitment: '0x398c27b4',
  transfer_public_to_private: '0x32c5dcf8',

  // Non-dispatch public functions
  balance_of_public: '0xff7949f2',
  total_supply: '0x8dd382ec',
  transfer_public_to_commitment: '0xd427610c',
  transfer_public_to_public: '0xc47adea0',

  // Optional non-dispatch public functions
  decimals: '0x6bff8f59',
  name: '0x5c5c9c42',
  symbol: '0x62cc9647f',
};

export const tokenAbiFunctionSelectorsSet = new Set<string>([
  tokenAbiFunctionSelectors.balance_of_private,
  tokenAbiFunctionSelectors.transfer_private_to_commitment,
  tokenAbiFunctionSelectors.transfer_private_to_private,
  tokenAbiFunctionSelectors.transfer_private_to_public,
  tokenAbiFunctionSelectors.transfer_private_to_public_with_commitment,
  tokenAbiFunctionSelectors.transfer_public_to_private,
]);

export const tokenAbiNondispatchPublicFunctionSelectorsSet = new Set<string>([
  tokenAbiFunctionSelectors.balance_of_public,
  tokenAbiFunctionSelectors.total_supply,
  tokenAbiFunctionSelectors.transfer_public_to_commitment,
  tokenAbiFunctionSelectors.transfer_public_to_public,
]);

export const tokenAbiOptionalNondispatchPublicFunctionSelectorsSet = new Set<string>([
  tokenAbiFunctionSelectors.decimals,
  tokenAbiFunctionSelectors.name,
  tokenAbiFunctionSelectors.symbol,
]);

export async function isToken(artifact: ContractArtifact): Promise<boolean> {
  const functionSelectors = new Set<string>(
    await Promise.all(
      artifact.functions.map(async (f) => {
        const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
        return selector.toString();
      }),
    ),
  );

  if (!functionSelectors.isSupersetOf(tokenAbiNondispatchPublicFunctionSelectorsSet)) return false;

  const nonDispatchFunctionSelectors = new Set<string>(
    await Promise.all(
      artifact.nonDispatchPublicFunctions.map(async (f) => {
        const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
        return selector.toString();
      }),
    ),
  );

  if (!nonDispatchFunctionSelectors.isSupersetOf(tokenAbiOptionalNondispatchPublicFunctionSelectorsSet)) {
    const contractClass = await getContractClassFromArtifact(artifact);
    console.warn(
      `Token artifact ${artifact.name} with contract class ID ${contractClass.id} is missing optional functions`,
    );
  }

  return true;
}
