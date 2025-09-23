import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { randomContractArtifact } from '@aztec/stdlib/testing';
import { describe, expect, it } from 'vitest';
import {
  aztecAddressToHexString,
  contractArtifactToHexString,
  frToHexString,
  hexStringToAztecAddress,
  hexStringToContractArtifact,
  hexStringToFr,
  jsonStringToPublicKeys,
  publicKeysToJsonString,
} from '../utils.js';

describe('utils', () => {
  describe('AztecAddress conversions', () => {
    it('should convert AztecAddress to hex string and back', () => {
      const originalHex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const address = AztecAddress.fromString(originalHex);
      const hexString = aztecAddressToHexString(address);
      const backToAddress = hexStringToAztecAddress(hexString);

      expect(hexString).toBe(originalHex);
      expect(backToAddress.toString()).toBe(originalHex);
      expect(backToAddress.equals(address)).toBe(true);
    });

    it('should handle zero address', () => {
      const zeroHex = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const address = AztecAddress.fromString(zeroHex);
      const hexString = aztecAddressToHexString(address);
      const backToAddress = hexStringToAztecAddress(hexString);

      expect(hexString).toBe(zeroHex);
      expect(backToAddress.equals(address)).toBe(true);
    });
  });

  describe('Fr conversions', () => {
    it('should convert Fr to hex string and back', () => {
      const originalHex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fr = Fr.fromString(originalHex);
      const hexString = frToHexString(fr);
      const backToFr = hexStringToFr(hexString);

      expect(hexString).toBe(originalHex);
      expect(backToFr.toString()).toBe(originalHex);
      expect(backToFr.equals(fr)).toBe(true);
    });

    it('should handle zero Fr', () => {
      const zeroFr = Fr.ZERO;
      const hexString = frToHexString(zeroFr);
      const backToFr = hexStringToFr(hexString);

      expect(backToFr.equals(zeroFr)).toBe(true);
    });

    it('should handle numeric values', () => {
      const fr = new Fr(12345);
      const hexString = frToHexString(fr);
      const backToFr = hexStringToFr(hexString);

      expect(backToFr.equals(fr)).toBe(true);
    });
  });

  describe('PublicKeys conversions', () => {
    it('should convert PublicKeys to JSON string and back', async () => {
      const originalKeys = await PublicKeys.random();
      const jsonString = publicKeysToJsonString(originalKeys);
      const backToKeys = jsonStringToPublicKeys(jsonString);

      expect(typeof jsonString).toBe('string');
      expect(JSON.parse(jsonString)).toBeTypeOf('object');
      expect(backToKeys.masterNullifierPublicKey.equals(originalKeys.masterNullifierPublicKey)).toBe(true);
      expect(backToKeys.masterIncomingViewingPublicKey.equals(originalKeys.masterIncomingViewingPublicKey)).toBe(true);
      expect(backToKeys.masterOutgoingViewingPublicKey.equals(originalKeys.masterOutgoingViewingPublicKey)).toBe(true);
      expect(backToKeys.masterTaggingPublicKey.equals(originalKeys.masterTaggingPublicKey)).toBe(true);
    });
  });

  describe('ContractArtifact conversions', () => {
    it('should generate hex strings from ContractArtifact serialization', () => {
      // Test with a minimal artifact structure - we don't need perfect validation for hex conversion test
      const testArtifact = randomContractArtifact();

      // Test that serialization to hex string works
      const hexString = contractArtifactToHexString(testArtifact);

      expect(typeof hexString).toBe('string');
      expect(hexString.startsWith('0x')).toBe(true); // Should have 0x prefix
      expect(hexString).toMatch(/^0x[0-9a-f]+$/); // Should be valid hex with 0x prefix)
      expect(hexString.length).toBeGreaterThan(0);
    });

    describe('Error handling', () => {
      it('should throw error for invalid AztecAddress hex string', () => {
        expect(() => hexStringToAztecAddress('invalid')).toThrow();
        expect(() => hexStringToAztecAddress('0x123')).toThrow(); // Too short
      });

      it('should throw error for invalid Fr hex string', () => {
        expect(() => hexStringToFr('invalid')).toThrow();
        expect(() => hexStringToFr('not-a-hex')).toThrow();
      });

      it('should throw error for invalid PublicKeys JSON', () => {
        expect(() => jsonStringToPublicKeys('invalid-json')).toThrow();
        expect(() => jsonStringToPublicKeys('{}')).toThrow(); // Missing required fields
      });

      it('should throw error for invalid ContractArtifact hex string', () => {
        expect(() => hexStringToContractArtifact('invalid' as `0x${string}`)).toThrow();
      });
    });
  });
});
