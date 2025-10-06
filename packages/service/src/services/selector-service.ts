import { artifactSelectors, type DbClient, functionSelectors } from '@aztec-artifacts/schema';
import { eq, gt, inArray } from 'drizzle-orm';
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

  async getAllSelectors(
    cursor: number,
    limit: number,
  ): Promise<Array<{ id: number; selector: string; signature: string }>> {
    return withSpan(
      {
        name: 'SelectorService.getAllSelectors',
        attributes: createServiceSpanAttributes('getAllSelectors', 'function_selectors'),
      },
      async (span) => {
        addSpanAttributes({
          'pagination.cursor': cursor.toString(),
          'pagination.limit': limit.toString(),
        });
        const startTime = performance.now();

        try {
          if (this.logger) {
            logDatabaseQuery(this.logger, 'select', DatabaseTable.FUNCTION_SELECTORS, {
              cursor,
              limit,
            });
          }

          const rows = await withSpan(
            {
              name: 'db.query.function_selectors.select_all_paginated',
              attributes: createDbSpanAttributes(
                'select',
                'function_selectors',
                'SELECT id, selector, signature FROM function_selectors WHERE id > ? ORDER BY id LIMIT ?',
              ),
            },
            () =>
              this.db
                .select({
                  id: functionSelectors.id,
                  selector: functionSelectors.selector,
                  signature: functionSelectors.signature,
                })
                .from(functionSelectors)
                .where(gt(functionSelectors.id, cursor))
                .orderBy(functionSelectors.id)
                .limit(limit + 1), // Get one extra to determine if there are more results
          );

          const duration = performance.now() - startTime;
          recordDbMetrics(createDbMetricTags('select', 'function_selectors'), duration);

          if (this.logger) {
            logServiceOperation(
              this.logger,
              'SelectorService',
              'getAllSelectors',
              { cursor, limit },
              { success: true, count: Math.min(rows.length, limit) },
            );
          }

          addSpanAttributes({ 'selector.count': Math.min(rows.length, limit).toString() });
          return rows.slice(0, limit); // Return only the requested limit
        } catch (error) {
          recordErrorMetrics('selector_service_error');
          recordSpanError(error, span);

          if (this.logger) {
            const message = error instanceof Error ? error.message : String(error);
            logServiceOperation(
              this.logger,
              'SelectorService',
              'getAllSelectors',
              { cursor, limit },
              { success: false, error: message },
            );
            this.logger.error(
              {
                cursor,
                limit,
                error: message,
              },
              'Failed to fetch selectors',
            );
          }

          throw error;
        }
      },
    );
  }

  async getArtifactsForSelector(selector: string): Promise<string[]> {
    const normalizedSelector = selector.toLowerCase();

    return withSpan(
      {
        name: 'SelectorService.getArtifactsForSelector',
        attributes: createServiceSpanAttributes('getArtifactsForSelector', 'artifact_selectors'),
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

          // First get all function_selector IDs that match this selector
          const selectorRows = await withSpan(
            {
              name: 'db.query.function_selectors.select_ids_by_selector',
              attributes: createDbSpanAttributes(
                'select',
                'function_selectors',
                'SELECT id FROM function_selectors WHERE selector = ?',
              ),
            },
            () =>
              this.db
                .select({ id: functionSelectors.id })
                .from(functionSelectors)
                .where(eq(functionSelectors.selector, normalizedSelector)),
          );

          if (selectorRows.length === 0) {
            const duration = performance.now() - startTime;
            recordDbMetrics(createDbMetricTags('select', 'function_selectors'), duration);
            addSpanAttributes({ 'artifact.count': '0' });
            return [];
          }

          // Now get all artifacts that reference these selector IDs
          const selectorIds = selectorRows.map((row) => row.id);
          const artifactRows = await withSpan(
            {
              name: 'db.query.artifact_selectors.select_artifacts_by_selector_ids',
              attributes: createDbSpanAttributes(
                'select',
                'artifact_selectors',
                'SELECT DISTINCT contractClassId FROM artifact_selectors WHERE functionSelectorId IN (?)',
              ),
            },
            () =>
              this.db
                .selectDistinct({ contractClassId: artifactSelectors.contractClassId })
                .from(artifactSelectors)
                .where(inArray(artifactSelectors.functionSelectorId, selectorIds)),
          );

          const duration = performance.now() - startTime;
          recordDbMetrics(createDbMetricTags('select', 'artifact_selectors'), duration);

          if (this.logger) {
            logServiceOperation(
              this.logger,
              'SelectorService',
              'getArtifactsForSelector',
              { selector: normalizedSelector },
              { success: true, count: artifactRows.length },
            );
          }

          addSpanAttributes({ 'artifact.count': artifactRows.length.toString() });
          return artifactRows.map((row) => row.contractClassId.toString());
        } catch (error) {
          recordErrorMetrics('selector_service_error');
          recordSpanError(error, span);

          if (this.logger) {
            const message = error instanceof Error ? error.message : String(error);
            logServiceOperation(
              this.logger,
              'SelectorService',
              'getArtifactsForSelector',
              { selector: normalizedSelector },
              { success: false, error: message },
            );
            this.logger.error(
              {
                selector: normalizedSelector,
                error: message,
              },
              'Failed to fetch artifacts for selector',
            );
          }

          throw error;
        }
      },
    );
  }
}
