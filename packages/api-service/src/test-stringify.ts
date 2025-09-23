import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { jsonStringify } from '@aztec/foundation/json-rpc';

async function main() {
  const addr = await AztecAddress.random();

  console.log(`jsonStringify: ${jsonStringify(addr)}`);
  console.log(`toString: ${addr.toString()}`);

  const fr = Fr.random();
  console.log(`jsonStringify: ${jsonStringify(fr)}`);
  console.log(`toString: ${fr.toString()}`);

  const pubKeys = await PublicKeys.random();
  console.log(`jsonStringify: ${jsonStringify(pubKeys)}`);
  console.log(`toString: ${pubKeys.toString()}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
