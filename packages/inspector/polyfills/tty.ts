export function isatty(): false {
  return false;
}

export class ReadStream {
  readonly isTTY = false;
}

export class WriteStream {
  readonly isTTY = false;
}

export default {
  isatty,
  ReadStream,
  WriteStream,
};
