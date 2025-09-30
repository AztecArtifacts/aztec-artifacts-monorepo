import { type DbClient, functionSelectors } from '@aztec-artifacts/schema';
import { eq } from 'drizzle-orm';
import { type BasicLogger, DatabaseTable, logDatabaseQuery, logServiceOperation } from '../utils/logging.js';
import { createDbMetricTags, recordDbMetrics, recordErrorMetrics } from '../utils/metrics.js';
import {
  addSpanAttributes,
  createDbSpanAttributes,
  createServiceSpanAttributes,
  recordSpanError,
  withSpan,
} from '../utils/tracing.js';

export class SelectorService {
  constructor(
    private readonly db: DbClient,
    private readonly logger?: BasicLogger,
  ) {}

  async getSignaturesForSelector(selector: string): Promise<string[]> {
    const normalizedSelector = selector.toLowerCase();

    return withSpan(
      {
        name: 'SelectorService.getSignaturesForSelector',
        attributes: createServiceSpanAttributes('getSignaturesForSelector', 'function_selectors'),
      },
      async (span) => {
        addSpanAttributes({ 'function.selector': normalizedSelector });
        const startTime = performance.now();

        try {
          if (this.logger) {
            logDatabaseQuery(this.logger, 'select', DatabaseTable.FUNCTION_SELECTORS, {
              selector: normalizedSelector,
            });
          }

          const rows = await withSpan(
            {
              name: 'db.query.function_selectors.select_by_selector',
              attributes: createDbSpanAttributes(
                'select',
                'function_selectors',
                'SELECT signature FROM function_selectors WHERE selector = ?',
              ),
            },
            () =>
              this.db
                .select({ signature: functionSelectors.signature })
                .from(functionSelectors)
                .where(eq(functionSelectors.selector, normalizedSelector)),
          );

          const duration = performance.now() - startTime;
          recordDbMetrics(createDbMetricTags('select', 'function_selectors'), duration);

          if (this.logger) {
            logServiceOperation(
              this.logger,
              'SelectorService',
              'getSignaturesForSelector',
              { selector: normalizedSelector },
              { success: true, count: rows.length },
            );
          }

          addSpanAttributes({ 'function.signature.count': rows.length.toString() });
          return rows.map((row) => row.signature);
        } catch (error) {
          recordErrorMetrics('selector_service_error');
          recordSpanError(error, span);

          if (this.logger) {
            const message = error instanceof Error ? error.message : String(error);
            logServiceOperation(
              this.logger,
              'SelectorService',
              'getSignaturesForSelector',
              { selector: normalizedSelector },
              { success: false, error: message },
            );
            this.logger.error(
              {
                selector: normalizedSelector,
                error: message,
              },
              'Failed to fetch selector signatures',
            );
          }

          throw error;
        }
      },
    );
  }
}
