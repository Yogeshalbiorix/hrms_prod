// Database Sync Configuration
// Toggle dual-database sync on/off globally

export const DB_SYNC_CONFIG = {
  // Enable sync to remote database
  ENABLE_REMOTE_SYNC: true,

  // Remote database ID (Cloudflare D1)
  REMOTE_DB_ID: '344fe95a-d6e9-4fcd-b331-601b5353d55f',

  // Remote database name
  REMOTE_DB_NAME: 'hrms-database',

  // Sync timeout (ms)
  SYNC_TIMEOUT: 5000,

  // Retry failed syncs
  RETRY_FAILED_SYNCS: true,

  // Maximum retry attempts
  MAX_RETRY_ATTEMPTS: 3,

  // Log sync operations
  LOG_SYNC: true,

  // Fail operation if remote sync fails (false = continue even if sync fails)
  FAIL_ON_SYNC_ERROR: false,
};

/**
 * Check if remote sync is enabled
 */
export function isSyncEnabled(): boolean {
  return DB_SYNC_CONFIG.ENABLE_REMOTE_SYNC;
}

/**
 * Log sync operation if logging is enabled
 */
export function logSync(operation: string, details?: any): void {
  if (DB_SYNC_CONFIG.LOG_SYNC) {
    console.log(`[DB_SYNC] ${operation}`, details || '');
  }
}
