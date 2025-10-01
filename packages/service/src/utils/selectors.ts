import type { ContractArtifact } from '@aztec/aztec.js';
import { decodeFunctionSignature, FunctionSelector } from '@aztec/stdlib/abi';

type SelectorAndSignature = {
  selector: FunctionSelector;
  signature: string;
};

export async function getSelectorsAndSignatureFromArtifact(
  artifact: ContractArtifact,
): Promise<SelectorAndSignature[]> {
  const functionSelectorsAndSignatures = await Promise.all(
    artifact.functions.map(async (f) => {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      const signature = decodeFunctionSignature(f.name, f.parameters);
      return { selector, signature };
    }),
  );

  functionSelectorsAndSignatures.push(
    ...(await Promise.all(
      artifact.nonDispatchPublicFunctions.map(async (f) => {
        const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
        const signature = decodeFunctionSignature(f.name, f.parameters);
        return { selector, signature };
      }),
    )),
  );

  return functionSelectorsAndSignatures;
}
