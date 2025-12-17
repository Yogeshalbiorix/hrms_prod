# 🚀 Final Setup Steps - Fix 401 Error

## The Problem
Your app is deployed but getting **401 Unauthorized** errors because the bindings aren't configured in Cloudflare dashboard.

## Quick Fix (2 minutes)

### Go to Cloudflare Dashboard
🔗 https://dash.cloudflare.com/

### Configure Bindings
1. Click **Workers & Pages** (left sidebar)
2. Click **hrms-prod**
3. Click **Settings** tab
4. Scroll to **Functions** section

**Add D1 Binding:**
- Click **Add binding** under "D1 database bindings"
- Variable name: `DB`
- D1 database: Select `hrms-database`
- Click **Save**

**Add KV Binding:**
- Click **Add binding** under "KV namespace bindings"  
- Variable name: `SESSION`
- KV namespace: Select `SESSION`
- Click **Save**

### Test Your App
🌐 https://04a7dc9b.hrms-prod.pages.dev

**Login with:**
- Username: `admin`
- Password: `admin123`

✅ Should work perfectly now!

## What These Bindings Do
- **DB** (D1) = Your database (employees, users, attendance, etc.)
- **SESSION** (KV) = User login sessions (keeps you logged in)

Without both configured, authentication fails with 401 errors.

---

**Need help?** Check [CONFIGURE_D1_BINDING.md](CONFIGURE_D1_BINDING.md) for detailed instructions.
