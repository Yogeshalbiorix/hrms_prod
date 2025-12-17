# Setup Live Database - Execute all schema files to Cloudflare D1
# Run this script: .\setup-live-database.ps1

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  HRMS - Live Database Setup (Cloudflare D1)  " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check if wrangler is installed
Write-Host "Checking wrangler installation..." -ForegroundColor Yellow
try {
    $null = wrangler --version
    Write-Host "SUCCESS: Wrangler is installed`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Wrangler is not installed!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g wrangler`n" -ForegroundColor Yellow
    exit 1
}

# List of schema files to execute in order
$schemaFiles = @(
    "schema.sql",
    "auth-schema.sql",
    "payroll-schema.sql",
    "recruitment-schema.sql",
    "activity-requests-schema.sql",
    "user-auth-enhancements.sql",
    "create-admin-hr-users.sql",
    "hierarchy-migration-safe.sql"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Executing Schema Files on Live Database      " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($file in $schemaFiles) {
    $filePath = Join-Path ".\db" $file
    
    if (Test-Path $filePath) {
        Write-Host "Executing: $file" -ForegroundColor Yellow
        Write-Host "-------------------------------------------" -ForegroundColor DarkGray
        
        $output = wrangler d1 execute hrms-database --remote --file=$filePath 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $file`n" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "FAILED: $file" -ForegroundColor Red
            Write-Host "Error: $output`n" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "SKIPPED: $file (file not found)`n" -ForegroundColor Yellow
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  Database Setup Summary                       " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan
Write-Host "Total Files Processed: $($schemaFiles.Count)" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

# Verify tables were created
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  Verifying Tables                             " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan
Write-Host "Fetching table list from database..." -ForegroundColor Yellow

wrangler d1 execute hrms-database --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Verify admin user
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  Verifying Admin User                         " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan
Write-Host "Checking for admin user..." -ForegroundColor Yellow

wrangler d1 execute hrms-database --remote --command "SELECT id, username, email, role FROM users WHERE role='admin' LIMIT 5;"

if ($failCount -eq 0) {
    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  DATABASE SETUP COMPLETED SUCCESSFULLY!      " -ForegroundColor Green
    Write-Host "================================================`n" -ForegroundColor Green
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Build your app: npm run build" -ForegroundColor White
    Write-Host "2. Deploy to Cloudflare: wrangler pages deploy dist" -ForegroundColor White
    Write-Host "3. Login with: admin / admin123`n" -ForegroundColor White
} else {
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host "  SETUP COMPLETED WITH ERRORS                 " -ForegroundColor Yellow
    Write-Host "================================================`n" -ForegroundColor Yellow
    Write-Host "Please review the errors above and fix them.`n" -ForegroundColor Yellow
}
