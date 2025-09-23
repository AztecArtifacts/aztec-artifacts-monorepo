/** biome-ignore-all lint/suspicious/noExplicitAny: tests */
import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { describe, expect, it } from 'vitest';
import { contractInstances } from '../../schema/contracts.js';
import { type DbNewToken, type DbToken, tokens } from '../../schema/tokens.js';

describe('tokens schema', () => {
  it('defines token table columns', () => {
    expect(tokens.id).toBeDefined();
    expect(tokens.symbol).toBeDefined();
    expect(tokens.name).toBeDefined();
    expect(tokens.decimals).toBeDefined();
    expect(tokens.address).toBeDefined();
    expect(tokens.createdAt).toBeDefined();
    expect(tokens.updatedAt).toBeDefined();
  });

  it('uses correct column names', () => {
    expect(tokens.symbol.name).toBe('symbol');
    expect(tokens.name.name).toBe('name');
    expect(tokens.decimals.name).toBe('decimals');
    expect(tokens.address.name).toBe('address');
  });

  it('provides DbToken types for selects', async () => {
    const address = await AztecAddress.random();
    const token: DbToken = {
      id: 1,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      address: address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(token.symbol).toBe('ETH');
    expect(token.name).toBe('Ethereum');
    expect(token.decimals).toBe(18);
    expect(token.address).toEqual(address);
  });

  it('provides DbNewToken types for inserts', async () => {
    const address = await AztecAddress.random();
    const newToken: DbNewToken = {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: address,
    };

    expect(newToken.symbol).toBe('USDC');
    expect(newToken.name).toBe('USD Coin');
    expect(newToken.decimals).toBe(6);
    expect(newToken.address).toEqual(address);
  });

  it('enforces foreign key constraint with contract_instances', async () => {
    const client = new PGlite();
    const db = drizzle(client);

    // Create tables using migrations to ensure all constraints are applied
    await migrate(db, { migrationsFolder: './migrations' });

    const contractAddress = await AztecAddress.random();
    const publicKeys = await PublicKeys.random();

    // Insert a contract instance first
    await db.insert(contractInstances).values({
      address: contractAddress,
      salt: Fr.random(),
      deployer: await AztecAddress.random(),
      currentContractClassId: null,
      originalContractClassId: null,
      initializationHash: Fr.random(),
      publicKeys,
    });

    // Should be able to insert a token with valid contract address
    await expect(
      db.insert(tokens).values({
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
        address: contractAddress,
      }),
    ).resolves.not.toThrow();

    const invalidContractAddress = await AztecAddress.random();

    // Should fail to insert a token with invalid contract address
    await expect(
      db.insert(tokens).values({
        symbol: 'FAIL',
        name: 'Fail Token',
        decimals: 18,
        address: invalidContractAddress,
      }),
    ).rejects.toThrow();

    await client.close();
  });
});
