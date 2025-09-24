import { aztecAddressToHexString, hexStringToAztecAddress } from '@aztec-artifacts/common';
import { type DbClient, tokens } from '@aztec-artifacts/schema';
import type { Span } from '@opentelemetry/api';
import { and, asc, eq, gt } from 'drizzle-orm';
import { type BasicLogger, DatabaseTable, logDatabaseQuery, logServiceOperation } from '../utils/logging.js';
import { createDbMetricTags, recordDbMetrics, recordErrorMetrics } from '../utils/metrics.js';
import {
  addSpanAttributes,
  createDbSpanAttributes,
  createServiceSpanAttributes,
  recordSpanError,
  withSpan,
} from '../utils/tracing.js';

type TokenRow = typeof tokens.$inferSelect;

export interface Token {
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
}

export function convertDbTokenToApi(dbToken: typeof tokens.$inferSelect, includeId = false): Token {
  const token: Token = {
    symbol: dbToken.symbol || '',
    name: dbToken.name || '',
    decimals: dbToken.decimals || 0,
    address: aztecAddressToHexString(dbToken.address),
  };

  if (includeId) {
    token.id = dbToken.id;
  }

  return token;
}

interface DbOperationOptions<T> {
  spanName: string;
  operation: string;
  table: (typeof DatabaseTable)[keyof typeof DatabaseTable];
  statement: string;
  logParams?: Record<string, unknown>;
  errorMetric?: string;
  onSuccess?: (result: T, duration: number) => void;
  onError?: (errorMessage: string, duration: number, error: unknown) => void;
}

export class TokenService {
  constructor(
    private db: DbClient,
    private logger?: BasicLogger,
  ) {}

  private async executeDbOperation<T>(
    options: DbOperationOptions<T>,
    operation: () => Promise<T>,
    span?: Span,
  ): Promise<T> {
    const startTime = performance.now();

    if (this.logger) {
      logDatabaseQuery(this.logger, options.operation, options.table, options.logParams);
    }

    try {
      const result = await withSpan(
        {
          name: options.spanName,
          attributes: createDbSpanAttributes(options.operation, options.table, options.statement),
        },
        operation,
      );

      const duration = performance.now() - startTime;
      recordDbMetrics(createDbMetricTags(options.operation, options.table), duration);
      options.onSuccess?.(result, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      if (options.errorMetric) {
        recordErrorMetrics(options.errorMetric);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      options.onError?.(errorMessage, duration, error);
      recordSpanError(error, span);
      throw error;
    }
  }

  async getTokens(cursor: number, limit: number): Promise<TokenRow[]> {
    return withSpan(
      {
        name: 'TokenService.getTokens',
        attributes: createServiceSpanAttributes('getTokens', 'tokens'),
      },
      async (span) => {
        const conditions = cursor > 0 ? [gt(tokens.id, cursor)] : [];

        // Add span attributes for operation context
        addSpanAttributes({
          'api.cursor': cursor.toString(),
          'api.limit': limit.toString(),
        });
        return this.executeDbOperation<TokenRow[]>(
          {
            spanName: 'db.query.tokens.select',
            operation: 'select',
            table: DatabaseTable.TOKENS,
            statement: 'SELECT * FROM tokens WHERE id > ? ORDER BY id ASC LIMIT ?',
            logParams: { cursor, limit },
            errorMetric: 'token_service_error',
            onSuccess: (results, duration) => {
              addSpanAttributes({
                'api.results.count': results.length.toString(),
                'api.duration_ms': duration.toString(),
              });

              if (this.logger) {
                logServiceOperation(
                  this.logger,
                  'TokenService',
                  'getTokens',
                  { cursor, limit },
                  {
                    success: true,
                    count: results.length,
                  },
                );
                this.logger.debug({ duration, resultCount: results.length }, 'Token query completed');
              }
            },
            onError: (errorMessage, duration) => {
              if (this.logger) {
                logServiceOperation(
                  this.logger,
                  'TokenService',
                  'getTokens',
                  { cursor, limit },
                  {
                    success: false,
                    error: errorMessage,
                  },
                );
                this.logger.error({ error: errorMessage, duration }, 'Token query failed');
              }
            },
          },
          () =>
            this.db
              .select()
              .from(tokens)
              .where(conditions.length > 0 ? and(...conditions) : undefined)
              .orderBy(asc(tokens.id))
              .limit(limit + 1),
          span,
        );
      },
    );
  }

  async getTokenByAddress(address: string): Promise<TokenRow | null> {
    return withSpan(
      {
        name: 'TokenService.getTokenByAddress',
        attributes: createServiceSpanAttributes('getTokenByAddress', 'tokens'),
      },
      async (span) => {
        // Add span attributes for operation context
        addSpanAttributes({
          'token.address': address,
        });
        const results = await this.executeDbOperation<TokenRow[]>(
          {
            spanName: 'db.query.tokens.select_by_address',
            operation: 'select',
            table: DatabaseTable.TOKENS,
            statement: 'SELECT * FROM tokens WHERE address = ?',
            logParams: { address },
            errorMetric: 'token_service_error',
            onSuccess: (queryResults, duration) => {
              const found = queryResults[0] !== undefined;
              addSpanAttributes({
                'api.found': found ? 'true' : 'false',
                'api.duration_ms': duration.toString(),
              });

              if (this.logger) {
                logServiceOperation(
                  this.logger,
                  'TokenService',
                  'getTokenByAddress',
                  { address },
                  {
                    success: true,
                    count: found ? 1 : 0,
                  },
                );
                this.logger.debug({ duration, found }, 'Token lookup by address completed');
              }
            },
            onError: (errorMessage, duration) => {
              if (this.logger) {
                logServiceOperation(
                  this.logger,
                  'TokenService',
                  'getTokenByAddress',
                  { address },
                  {
                    success: false,
                    error: errorMessage,
                  },
                );
                this.logger.error({ error: errorMessage, duration }, 'Token lookup by address failed');
              }
            },
          },
          () => {
            const aztecAddress = hexStringToAztecAddress(address);
            return this.db.select().from(tokens).where(eq(tokens.address, aztecAddress));
          },
          span,
        );

        return results[0] ?? null;
      },
    );
  }

  async testConnection(): Promise<TokenRow[]> {
    return this.executeDbOperation<TokenRow[]>(
      {
        spanName: 'db.query.tokens.testConnection',
        operation: 'select',
        table: DatabaseTable.TOKENS,
        statement: 'SELECT * FROM tokens LIMIT 1',
        logParams: { limit: 1 },
        onSuccess: (results, duration) => {
          if (this.logger) {
            logServiceOperation(
              this.logger,
              'TokenService',
              'testConnection',
              {},
              {
                success: true,
                count: results.length,
              },
            );
            this.logger.debug({ duration }, 'Database connection test completed');
          }
        },
        onError: (errorMessage, duration, error) => {
          if (this.logger) {
            logServiceOperation(
              this.logger,
              'TokenService',
              'testConnection',
              {},
              {
                success: false,
                error: errorMessage,
              },
            );
            this.logger.error({ error: errorMessage, duration, cause: error }, 'Database connection test failed');
          }
        },
      },
      () => this.db.select().from(tokens).limit(1),
    );
  }
}
