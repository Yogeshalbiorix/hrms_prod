# Configure Database & Session Bindings

## Current Status
✅ Application deployed: https://04a7dc9b.hrms-prod.pages.dev
✅ KV namespace created (ID: 50e35864ff574dfc8560f4bfe6792d46)
❌ Bindings not configured in dashboard (causing 401 errors)

## Fix the 401 Error - Configure Bindings

### Step 1: Access Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com/
2. Login with your Cloudflare account
3. Click **Workers & Pages** in the left sidebar

### Step 2: Configure BOTH Bindings
1. Click on **hrms-prod** project
2. Go to **Settings** tab
3. Scroll down to **Functions** section

#### Configure D1 Database Binding:
4. Click **Add binding** under **D1 database bindings**
5. Enter:
   - **Variable name**: `DB`
   - **D1 database**: Select `hrms-database`
6. Click **Save**

#### Configure KV Session Binding:
7. Click **Add binding** under **KV namespace bindings**
8. Enter:
   - **Variable name**: `SESSION`
   - **KV namespace**: Select `SESSION` (ID: 50e35864ff574dfc8560f4bfe6792d46)
9. Click **Save**

### Step 3: Redeploy (Automatic)
The binding will be applied automatically to the next deployment. Since we just deployed, you might need to trigger a redeploy:

```powershell
wrangler pages deploy dist --project-name=hrms-prod
```

### Step 4: Test Login
1. Visit: https://04a7dc9b.hrms-prod.pages.dev
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Should redirect to dashboard successfully without 401 errors!

## Why This Happened
- The app requires TWO bindings: **DB** (D1 database) and **SESSION** (KV namespace)
- Without DB binding → 500 errors (can't access data)
- Without SESSION binding → 401 errors (can't authenticate users)
- Cloudflare Pages requires bindings to be configured in the dashboard, not just wrangler.jsonc

## Alternative: Environment Variables
If you want to use wrangler.jsonc instead:
1. Ensure wrangler.jsonc only has these fields:
   ```jsonc
   {
     "name": "hrms-prod",
     "pages_build_output_dir": "dist",
     "compatibility_date": "2025-04-15",
     "compatibility_flags": ["nodejs_compat"],
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "hrms-database",
         "database_id": "344fe95a-d6e9-4fcd-b331-601b5353d55f"
       }
     ]
   }
   ```
2. Deploy with: `wrangler pages deploy dist --project-name=hrms-prod`

## Verify Database
Check that data exists:
```powershell
wrangler d1 execute hrms-database --remote --command="SELECT username, role FROM users WHERE role='admin';"
```

Expected output:
```
┌──────────────┬───────┐
│ username     │ role  │
├──────────────┼───────┤
│ admin        │ admin │
├──────────────┼───────┤
│ hrmanager1   │ admin │
├──────────────┼───────┤
│ hrmanager2   │ admin │
└──────────────┴───────┘
```

## Next Steps After Fix
1. ✅ Login successfully
2. Create test employee (will auto-create user account)
3. Test attendance, leave, payroll features
4. Configure email settings (EMAILJS_SETUP_GUIDE.md)
