// Database synchronization utility
// Saves data to both local and remote databases

import { baseUrl } from './base-url';
import { isSyncEnabled, logSync, DB_SYNC_CONFIG } from './db-sync-config';

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1Result>;
  first(): Promise<any>;
}

interface D1Result {
  success: boolean;
  meta?: any;
  results?: any[];
  error?: string;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Sync query to remote database via API
 * @param query - SQL query to execute
 * @param params - Query parameters
 */
export async function syncToRemote(
  query: string,
  params: any[] = []
): Promise<void> {
  try {
    // In development, we need to use wrangler CLI to access the real remote database
    // The API endpoint won't work because it uses the same local DB binding

    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      // Development mode: Use wrangler CLI to execute on remote database
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Escape query for shell
      const escapedQuery = query.replace(/"/g, '\\"').replace(/\n/g, ' ');

      // Build wrangler command with parameters
      let finalQuery = escapedQuery;
      if (params.length > 0) {
        // Replace ? placeholders with actual values for wrangler
        let paramIndex = 0;
        finalQuery = escapedQuery.replace(/\?/g, () => {
          const value = params[paramIndex++];
          if (value === null || value === undefined) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          return String(value);
        });
      }

      const cmd = `npx wrangler d1 execute hrms-database --remote --command "${finalQuery}"`;

      logSync('Executing remote sync via wrangler', { query: finalQuery.substring(0, 100) });

      await execAsync(cmd);
      logSync('Remote sync successful via wrangler');
    } else {
      // Production mode: Use API endpoint (which will have proper remote DB binding)
      const response = await fetch(`${baseUrl}/api/sync/remote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params })
      });

      const result = await response.json() as any;

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Remote sync failed with status ${response.status}`);
      }

      logSync('Remote sync successful via API', { query: query.substring(0, 50) });
    }
  } catch (error) {
    console.error('Failed to sync to remote database:', error);
    logSync('Remote sync error', error instanceof Error ? error.message : 'Unknown error');
    // Don't throw - local save is primary
  }
}

/**
 * Execute INSERT/UPDATE/DELETE on both databases
 * @param localDB - Local D1 database instance
 * @param query - SQL query
 * @param params - Query parameters
 * @returns Result from local database
 */
export async function executeSync(
  localDB: D1Database,
  query: string,
  params: any[] = []
): Promise<D1Result> {
  try {
    // Execute on local database (primary)
    const stmt = localDB.prepare(query);
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    const localResult = await boundStmt.run();

    logSync('Local execution successful', { query: query.substring(0, 50) });

    // Sync to remote asynchronously if enabled (don't wait)
    if (isSyncEnabled()) {
      syncToRemote(query, params).catch(err => {
        logSync('Remote sync failed', err.message);
        if (DB_SYNC_CONFIG.FAIL_ON_SYNC_ERROR) {
          throw err;
        }
      });
    }

    return localResult;
  } catch (error) {
    console.error('Database sync error:', error);
    throw error;
  }
}
