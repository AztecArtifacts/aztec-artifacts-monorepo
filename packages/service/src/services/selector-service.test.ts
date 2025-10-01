import { Fr } from '@aztec/aztec.js';
import type { DbClient } from '@aztec-artifacts/schema';
import { describe, expect, it, vi } from 'vitest';
import { SelectorService } from './selector-service.js';

describe('SelectorService', () => {
  it('returns signatures for a selector and normalizes input', async () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const selector = '0xAABBCCDD';
    const normalized = selector.toLowerCase();
    const signatures = ['transfer(address,uint256)', 'approve(address,uint256)'];

    const whereMock = vi.fn().mockResolvedValue(signatures.map((signature) => ({ signature })));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });

    const db = {
      select: selectMock,
    } as unknown as DbClient;

    const service = new SelectorService(db, logger);
    const result = await service.getSignaturesForSelector(selector);

    expect(result).toEqual(signatures);
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(expect.anything());
    expect(whereMock).toHaveBeenCalledTimes(1);

    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'database',
        conditions: expect.objectContaining({ selector: normalized }),
      }),
      expect.stringContaining('Database select'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'service',
        service: 'SelectorService',
        params: { selector: normalized },
        success: true,
        count: signatures.length,
      }),
      expect.stringContaining('SelectorService.getSignaturesForSelector completed'),
    );
  });

  it('returns contract class IDs for a selector', async () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const selector = '0xAABBCCDD';
    const selectorIds = [{ id: 1 }, { id: 2 }];
    const classId1 = Fr.random();
    const classId2 = Fr.random();
    const artifactRows = [{ contractClassId: classId1 }, { contractClassId: classId2 }];

    // Mock for first query (get selector IDs)
    const whereMock1 = vi.fn().mockResolvedValue(selectorIds);
    const fromMock1 = vi.fn().mockReturnValue({ where: whereMock1 });
    const selectMock1 = vi.fn().mockReturnValue({ from: fromMock1 });

    // Mock for second query (get artifacts)
    const whereMock2 = vi.fn().mockResolvedValue(artifactRows);
    const fromMock2 = vi.fn().mockReturnValue({ where: whereMock2 });
    const selectDistinctMock = vi.fn().mockReturnValue({ from: fromMock2 });

    const db = {
      select: selectMock1,
      selectDistinct: selectDistinctMock,
    } as unknown as DbClient;

    const service = new SelectorService(db, logger);
    const result = await service.getArtifactsForSelector(selector);

    expect(result).toEqual([classId1.toString(), classId2.toString()]);
    expect(selectMock1).toHaveBeenCalledTimes(1);
    expect(selectDistinctMock).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when selector has no matching function_selectors', async () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const selector = '0xAABBCCDD';

    // Mock for first query (get selector IDs) - returns empty
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });

    const db = {
      select: selectMock,
    } as unknown as DbClient;

    const service = new SelectorService(db, logger);
    const result = await service.getArtifactsForSelector(selector);

    expect(result).toEqual([]);
    expect(selectMock).toHaveBeenCalledTimes(1);
  });
});
