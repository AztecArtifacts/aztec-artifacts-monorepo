import { Buffer } from 'buffer';
import process from 'process';

type GlobalWithPolyfills = typeof globalThis & {
  Buffer?: typeof Buffer;
  process?: typeof process;
};

const globalTarget = globalThis as GlobalWithPolyfills;

if (!globalTarget.Buffer) {
  globalTarget.Buffer = Buffer;
}

const ensuredProcess = globalTarget.process ?? process;
ensuredProcess.env = ensuredProcess.env ?? {};
globalTarget.process = ensuredProcess;
