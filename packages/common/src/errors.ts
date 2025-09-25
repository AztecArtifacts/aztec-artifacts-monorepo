/**
 * Error thrown when serialization of Aztec objects fails.
 */
export class SerializationError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when deserialization of API payloads fails.
 */
export class DeserializationError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
    this.name = this.constructor.name;
  }
}
