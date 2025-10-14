import { AztecAddress, type AztecNode, Fr, type FunctionCall, HashedValues, type NodeInfo, Tx } from '@aztec/aztec.js';
import { makeTuple } from '@aztec/foundation/array';
import { getVKTreeRoot } from '@aztec/noir-protocol-circuits-types/vk-tree';
import { protocolContractTreeRoot } from '@aztec/protocol-contracts';
import { Gas, GasFees, GasSettings } from '@aztec/stdlib/gas';
import {
  PartialPrivateTailPublicInputsForPublic,
  PrivateKernelTailCircuitPublicInputs,
  PrivateToPublicAccumulatedData,
  PublicCallRequest,
} from '@aztec/stdlib/kernel';
import { ClientIvcProof } from '@aztec/stdlib/proofs';
import type { BlockHeader } from '@aztec/stdlib/tx';
import { TxConstantData, TxContext } from '@aztec/stdlib/tx';

export async function getNodeInfo(aztecNode: AztecNode): Promise<{ info: NodeInfo; blockHeader: BlockHeader }> {
  const info = await aztecNode.getNodeInfo();
  const blockHeader = await aztecNode.getBlockHeader();
  if (!blockHeader) {
    throw new Error('No block header available from node');
  }
  return { info, blockHeader };
}

export async function createTxFromPublicCalls(
  aztecNode: AztecNode,
  calls: FunctionCall[],
  nodeInfo?: { info: NodeInfo; blockHeader: BlockHeader },
) {
  const { info, blockHeader } = nodeInfo ?? (await getNodeInfo(aztecNode));
  const emptyRad = PrivateToPublicAccumulatedData.empty();

  if (calls.length > emptyRad.publicCallRequests.length) {
    throw new Error(`tried to simulate too many public calls: ${calls.length}`);
  }
  const allHashedValues = await Promise.all(
    calls.map(async (call) => HashedValues.fromCalldata([call.selector.toField(), ...call.args])),
  );
  const publicCallRequests = makeTuple(emptyRad.publicCallRequests.length, (i) => {
    const call = calls[i];
    if (!call) {
      return PublicCallRequest.empty();
    }
    if (!allHashedValues[i]) {
      throw new Error('hashed values missing for public call');
    }
    return new PublicCallRequest(AztecAddress.zero(), call.to, call.isStatic, allHashedValues[i].hash);
  });

  const revertibleAccumulatedData = new PrivateToPublicAccumulatedData(
    emptyRad.noteHashes,
    emptyRad.nullifiers,
    emptyRad.l2ToL1Msgs,
    emptyRad.privateLogs,
    emptyRad.contractClassLogsHashes,
    publicCallRequests,
  );
  const forPublic = new PartialPrivateTailPublicInputsForPublic(
    PrivateToPublicAccumulatedData.empty(),
    revertibleAccumulatedData,
    PublicCallRequest.empty(),
  );

  const constants = new TxConstantData(
    blockHeader,
    new TxContext(
      info.l1ChainId,
      info.rollupVersion,
      GasSettings.default({
        maxFeesPerGas: GasFees.from({
          feePerDaGas: Fr.MODULUS - 1n,
          feePerL2Gas: Fr.MODULUS - 1n,
        }),
      }),
    ),
    getVKTreeRoot(),
    protocolContractTreeRoot,
  );

  const privateKernelTailCircuitPublicInputs = new PrivateKernelTailCircuitPublicInputs(
    constants,
    /*gasUsed=*/ new Gas(0, 0),
    /*feePayer=*/ AztecAddress.zero(),
    /*includeByTimestamp=*/ 0n,
    forPublic,
  );

  return Tx.create({
    data: privateKernelTailCircuitPublicInputs,
    clientIvcProof: ClientIvcProof.empty(),
    contractClassLogFields: [],
    publicFunctionCalldata: allHashedValues,
  });
}
