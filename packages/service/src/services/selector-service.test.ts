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
});
