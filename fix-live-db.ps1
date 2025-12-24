# Fix Live Database - Add missing columns
# Run this script: .\fix-live-db.ps1

Write-Host "Fixing Live Database..." -ForegroundColor Cyan

# 1. Add manager_id
Write-Host "Adding manager_id column..." -ForegroundColor Yellow
$output = wrangler d1 execute hrms-database --remote --command "ALTER TABLE employees ADD COLUMN manager_id INTEGER;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: manager_id added" -ForegroundColor Green
} else {
    Write-Host "INFO: manager_id might already exist (ignoring error)" -ForegroundColor DarkGray
}

# 2. Add hierarchy_level
Write-Host "Adding hierarchy_level column..." -ForegroundColor Yellow
$output = wrangler d1 execute hrms-database --remote --command "ALTER TABLE employees ADD COLUMN hierarchy_level INTEGER DEFAULT 5;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: hierarchy_level added" -ForegroundColor Green
} else {
    Write-Host "INFO: hierarchy_level might already exist (ignoring error)" -ForegroundColor DarkGray
}

# 3. Create indexes (using the safe migration file which has indexes UNCOMMENTED)
# Note: The file logic was: commented out ALTERs, but active CREATE INDEX.
# So running it is correct after we added columns.
Write-Host "Creating indexes..." -ForegroundColor Yellow
$output = wrangler d1 execute hrms-database --remote --file=./db/hierarchy-migration-safe.sql 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Indexes created" -ForegroundColor Green
} else {
    Write-Host "FAILED: Indexes creation" -ForegroundColor Red
    Write-Host $output -ForegroundColor Red
}

# 4. Verify columns
Write-Host "Verifying employees table structure..." -ForegroundColor Yellow
wrangler d1 execute hrms-database --remote --command "PRAGMA table_info(employees);"

Write-Host "Done." -ForegroundColor Cyan
