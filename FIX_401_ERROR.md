# Fix 401 Authentication Error

## Problem
Getting 401 errors because the SESSION KV namespace is not configured in Cloudflare.

## Quick Fix

### Step 1: Create KV Namespace
```powershell
wrangler kv:namespace create SESSION
```

This will output something like:
```
🌀 Creating namespace with title "hrms-prod-SESSION"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SESSION", id = "abc123..." }
```

**Copy the ID** from the output!

### Step 2: Create Preview KV Namespace (for development)
```powershell
wrangler kv:namespace create SESSION --preview
```

Copy this ID too!

### Step 3: Configure in Cloudflare Dashboard

**Option A: Via Dashboard (Recommended)**
1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages** → **hrms-prod** → **Settings**
3. Under **Functions**, find **KV namespace bindings**
4. Click **Add binding**
5. Set:
   - **Variable name**: `SESSION`
   - **KV namespace**: Select the `hrms-prod-SESSION` namespace
6. Click **Save**

**Option B: Update wrangler.jsonc**
Add the KV binding to your wrangler.jsonc:
```jsonc
{
  "name": "hrms-prod",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2025-04-15",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [
    {
      "binding": "SESSION",
      "id": "YOUR_KV_ID_HERE",
      "preview_id": "YOUR_PREVIEW_KV_ID_HERE"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hrms-database",
      "database_id": "344fe95a-d6e9-4fcd-b331-601b5353d55f"
    }
  ]
}
```

### Step 4: Redeploy
```powershell
npm run build
wrangler pages deploy dist --project-name=hrms-prod
```

### Step 5: Test
Visit: https://da755439.hrms-prod.pages.dev
- Login with: `admin` / `admin123`
- Should work without 401 errors!

## What is SESSION KV?
- Cloudflare KV is a key-value store
- The app uses it to store user sessions (login state)
- Without it, authentication fails with 401 errors

## Both Bindings Required
Your app needs TWO bindings configured:
1. ✅ **DB** (D1 database) - for storing data
2. ❌ **SESSION** (KV namespace) - for user sessions

Configure SESSION binding following the steps above, then you'll be able to login successfully!
