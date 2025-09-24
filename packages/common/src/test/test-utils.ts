import { expect } from 'vitest';
import type { Hex } from '../types.js';

/**
 * Test utility for round-trip encoding and decoding
 */
export function testRoundTrip<T>(
  _name: string,
  value: T,
  encode: (value: T) => Hex,
  decode: (encoded: Hex) => T,
  equals?: (a: T, b: T) => boolean,
): void {
  const encoded = encode(value);
  const decoded = decode(encoded);

  if (equals) {
    expect(equals(decoded, value)).toBe(true);
  } else if (typeof (value as unknown as { equals?: (other: unknown) => boolean }).equals === 'function') {
    expect((decoded as unknown as { equals: (other: unknown) => boolean }).equals(value)).toBe(true);
  } else if (
    typeof (value as unknown as { toString?: () => string }).toString === 'function' &&
    typeof (decoded as unknown as { toString?: () => string }).toString === 'function'
  ) {
    expect((decoded as unknown as { toString: () => string }).toString()).toEqual(
      (value as unknown as { toString: () => string }).toString(),
    );
  } else {
    expect(decoded).toEqual(value);
  }
}

/**
 * Test utility for hex string round-trip conversion
 */
export function testHexRoundTrip<T>(
  _name: string,
  value: T,
  toHex: (value: T) => Hex,
  fromHex: (hex: Hex) => T,
  equals?: (a: T, b: T) => boolean,
): void {
  const hex = toHex(value);

  // Verify hex string format
  expect(hex).toMatch(/^0x[0-9a-f]+$/i);

  const decoded = fromHex(hex);

  if (equals) {
    expect(equals(decoded, value)).toBe(true);
  } else if (typeof (value as unknown as { equals?: (other: unknown) => boolean }).equals === 'function') {
    expect((decoded as unknown as { equals: (other: unknown) => boolean }).equals(value)).toBe(true);
  } else if (
    typeof (value as unknown as { toString?: () => string }).toString === 'function' &&
    typeof (decoded as unknown as { toString?: () => string }).toString === 'function'
  ) {
    expect((decoded as unknown as { toString: () => string }).toString()).toEqual(
      (value as unknown as { toString: () => string }).toString(),
    );
  } else {
    expect(decoded).toEqual(value);
  }
}

/**
 * Test utility for error validation
 */
export function expectError(fn: () => unknown, errorMessagePattern: string | RegExp): void {
  expect(() => fn()).toThrow(errorMessagePattern);
}

/**
 * Test utility for async error validation
 */
export async function expectAsyncError(
  fn: () => Promise<unknown>,
  errorMessagePattern: string | RegExp,
): Promise<void> {
  await expect(fn()).rejects.toThrow(errorMessagePattern);
}
