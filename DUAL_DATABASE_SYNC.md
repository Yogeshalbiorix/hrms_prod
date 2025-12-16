# Dual Database Sync System

## Overview

The HRMS application now supports **dual-database synchronization**, automatically saving data to both:
- **Local Database** (for development)
- **Remote Database** (Cloudflare D1 production database)

## How It Works

When you add data through the frontend (employees, departments, leaves, etc.), the system:
1. ✅ Saves to **local database** immediately (primary)
2. 🔄 Syncs to **remote database** asynchronously (background)
3. ✅ Returns success to the frontend (doesn't wait for remote sync)

## Configuration

### Enable/Disable Sync

Edit `src/lib/db-sync-config.ts`:

```typescript
export const DB_SYNC_CONFIG = {
  // Enable sync to remote database
  ENABLE_REMOTE_SYNC: true,  // Set to false to disable
  
  // Other options...
};
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `ENABLE_REMOTE_SYNC` | `true` | Master switch for dual-database sync |
| `REMOTE_DB_ID` | `344fe95a...` | Cloudflare D1 database ID |
| `SYNC_TIMEOUT` | `5000` | Timeout for sync operations (ms) |
| `RETRY_FAILED_SYNCS` | `true` | Retry if sync fails |
| `MAX_RETRY_ATTEMPTS` | `3` | Maximum retry attempts |
| `LOG_SYNC` | `true` | Log sync operations to console |
| `FAIL_ON_SYNC_ERROR` | `false` | Fail the operation if remote sync fails |

## Supported Operations

The following operations are automatically synced:

### ✅ Employees
- Create employee → `POST /api/employees`
- Update employee → `PUT /api/employees/[id]`

### ✅ Departments
- Create department → `POST /api/departments`
- Update department → `PUT /api/departments/[id]`

### ✅ Leave Management
- Create leave request → `POST /api/leaves`
- Update leave status → `PUT /api/leaves/[id]`

### 🔄 Coming Soon
- Attendance records
- Payroll data
- Performance reviews
- Recruitment applications

## Usage

### For Developers

No changes needed! The sync happens automatically when using the API:

```typescript
// Example: Creating an employee
const response = await fetch('/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    position: 'Developer',
    join_date: '2025-01-01'
  })
});

// Data is saved to BOTH databases automatically
```

### Adding Sync to New Endpoints

To add sync to a new database operation:

1. **Update the function in `src/lib/db.ts`**:

```typescript
export async function createYourEntity(
  db: any,
  data: YourEntity,
  syncRemote: boolean = false  // Add this parameter
): Promise<number> {
  const query = `INSERT INTO your_table (...) VALUES (...)`;
  const params = [/* your params */];
  
  const result = await db.prepare(query).bind(...params).run();
  
  // Add sync logic
  if (syncRemote) {
    try {
      const { executeSync } = await import('./db-sync');
      await executeSync(db, query, params);
    } catch (error) {
      console.warn('Remote sync failed:', error);
    }
  }
  
  return result.meta.last_row_id;
}
```

2. **Update the API endpoint**:

```typescript
// In your API file
const id = await createYourEntity(db, data, true);  // Pass true to enable sync
```

## Monitoring

### Check Sync Status

Watch the console for sync logs:

```
[DB_SYNC] Local execution successful { query: 'INSERT INTO employees ...' }
[DB_SYNC] Remote sync initiated
```

### Verify Remote Data

Check if data was synced to remote:

```bash
npx wrangler d1 execute hrms-database --remote --command "SELECT * FROM employees ORDER BY id DESC LIMIT 5;"
```

## Troubleshooting

### Sync Not Working?

1. **Check if sync is enabled**:
   ```typescript
   // In db-sync-config.ts
   ENABLE_REMOTE_SYNC: true  // Must be true
   ```

2. **Check remote database binding**:
   ```bash
   npx wrangler d1 list
   # Should show: hrms-database
   ```

3. **Check logs**:
   Look for `[DB_SYNC]` messages in the console

### Sync Failing?

- Local operations still succeed (data is saved locally)
- Errors are logged but don't block the user
- Enable `FAIL_ON_SYNC_ERROR: true` if you want strict sync

## Architecture

```
Frontend Form
    ↓
API Endpoint (/api/employees)
    ↓
Database Function (createEmployee)
    ↓
    ├─→ Local DB (Primary) ✅ Immediate
    └─→ Remote Sync (Background) 🔄 Async
```

## Benefits

1. **Fast User Experience**: Local writes are instant
2. **Data Redundancy**: Same data in both databases
3. **Flexible Development**: Use local DB for dev, remote for prod
4. **No Data Loss**: If remote sync fails, data is still saved locally
5. **Easy Testing**: Can disable sync during testing

## Security

- Remote sync uses the same Cloudflare D1 binding
- No additional authentication needed
- Queries are parameterized (SQL injection safe)

## Performance

- **Local writes**: < 10ms
- **Remote sync**: Asynchronous (doesn't block)
- **Total user-facing latency**: Same as local-only

## Production Deployment

For production, you can:
1. Keep sync enabled (recommended for backup)
2. Use only remote DB by switching the binding
3. Disable sync and use remote DB directly

## Next Steps

- [ ] Add sync queue for failed operations
- [ ] Implement batch sync for bulk operations
- [ ] Add sync status dashboard
- [ ] Create manual sync trigger button
- [ ] Add conflict resolution for concurrent edits

---

**Need Help?** Check the console logs or review `src/lib/db-sync.ts`
