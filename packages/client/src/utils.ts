import type { ContractArtifact, FunctionAbi } from '@aztec/aztec.js';
import { getAllFunctionAbis } from '@aztec/aztec.js';

export function getFunctionAbi(artifact: ContractArtifact, functionName: string): FunctionAbi {
  const functionAbi = getAllFunctionAbis(artifact).find(({ name }) => name === functionName);
  if (!functionAbi) {
    throw new Error(`Function ${functionName} not found in artifact ABI`);
  }
  return functionAbi;
}
