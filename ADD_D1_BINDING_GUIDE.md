# 🔧 Add D1 Database Binding to Cloudflare Pages

## ⚠️ Current Error

```
Login error: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

This happens because your Cloudflare Pages deployment **doesn't have access to the database**.

---

## ✅ Solution: Add D1 Binding in Dashboard

### Step 1: Open Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com/
2. Login with your account

### Step 2: Navigate to Your Project

1. Click **Workers & Pages** in the left sidebar
2. Find and click on **hrms-prod** project

### Step 3: Add D1 Database Binding

1. Click the **Settings** tab at the top
2. Scroll down to **Functions** section
3. Find **D1 database bindings**
4. Click **Add binding** button
5. Fill in:
   - **Variable name:** `DB`
   - **D1 database:** Select `hrms-database` from dropdown
6. Click **Save**

### Step 4: Redeploy (IMPORTANT!)

After saving the binding, you MUST redeploy:

```bash
wrangler pages deploy dist --project-name=hrms-prod
```

---

## 🎯 Quick Commands

```bash
# 1. Rebuild (if you made changes)
npm run build

# 2. Redeploy to Cloudflare Pages
wrangler pages deploy dist --project-name=hrms-prod
```

---

## 📸 Visual Guide

### What to Look For:

1. **Workers & Pages** (left sidebar)
2. **hrms-prod** (your project)
3. **Settings** tab
4. **Functions** section
5. **D1 database bindings** → **Add binding**

### Binding Configuration:

```
Variable name: DB
D1 database: hrms-database
```

⚠️ **Important:** The variable name MUST be `DB` (uppercase)

---

## ✅ Verify It Works

After adding the binding and redeploying:

1. Visit: https://7141ec44.hrms-prod.pages.dev
2. Try logging in:
   - Username: `admin`
   - Password: `admin123`

If it works, you'll see the dashboard! 🎉

---

## 🐛 Still Getting Errors?

### Error: "Database not configured"
- **Cause:** D1 binding not added or wrong variable name
- **Fix:** Make sure variable name is exactly `DB`

### Error: "Table does not exist"
- **Cause:** Database tables not created
- **Fix:** Run `npm run db:setup:live` to create tables

### Error: "No admin user"
- **Cause:** Admin user not created
- **Fix:** Run:
  ```bash
  wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql
  ```

---

## 📊 Your Deployment Info

- **Project Name:** hrms-prod
- **Live URL:** https://7141ec44.hrms-prod.pages.dev
- **Database:** hrms-database
- **Database ID:** 344fe95a-d6e9-4fcd-b331-601b5353d55f
- **Required Binding:** DB → hrms-database

---

## 💡 Pro Tip: Update wrangler.jsonc

To avoid manual binding setup in future deployments, update your `wrangler.jsonc`:

```jsonc
{
  "name": "hrms-prod",
  "pages_build_output_dir": "dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hrms-database",
      "database_id": "344fe95a-d6e9-4fcd-b331-601b5353d55f"
    }
  ]
}
```

Then future deployments will automatically include the binding!

---

## 🎯 Summary

1. ✅ Go to Cloudflare Dashboard
2. ✅ Find hrms-prod project
3. ✅ Settings → Functions → D1 database bindings
4. ✅ Add binding: `DB` → `hrms-database`
5. ✅ Save
6. ✅ Redeploy: `wrangler pages deploy dist --project-name=hrms-prod`
7. ✅ Test login at https://7141ec44.hrms-prod.pages.dev

**Need help?** Let me know if you get stuck on any step!
