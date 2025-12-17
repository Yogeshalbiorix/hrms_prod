# 🚀 Cloudflare Pages Deployment Guide for HRMS

## ⚠️ IMPORTANT: Why Not Webflow?

Your HRMS application **CANNOT be deployed to Webflow** because:

| Feature | Your HRMS Needs | Webflow Supports |
|---------|----------------|------------------|
| Server-side API | ✅ Required | ❌ Not supported |
| Database (D1) | ✅ Required | ❌ Not supported |
| Authentication | ✅ Required | ❌ Not supported |
| Dynamic Routes | ✅ Required | ❌ Limited |
| POST/PUT/DELETE | ✅ Required | ❌ Not supported |

**Webflow** = Static website builder  
**Your HRMS** = Full-stack application with database

### The Error You're Getting
```
POST https://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/login 405 (Method Not Allowed)
```

This is because Webflow doesn't have your API endpoints (`/api/auth/login`, `/api/employees`, etc.) - they don't exist there!

---

## ✅ Correct Deployment: Cloudflare Pages

Your application is configured for **Cloudflare Pages** with:
- Astro SSR (Server-Side Rendering)
- Cloudflare D1 Database
- Cloudflare Workers for API routes

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Cloudflare Account** (Free or Paid)
   - Sign up at: https://dash.cloudflare.com/sign-up
   
2. **Wrangler CLI** (Cloudflare's CLI tool)
   ```bash
   npm install -g wrangler
   ```

3. **GitHub Repository** 
   - Your code should be in a GitHub repository
   - You already have this connected to Webflow (we'll reconnect to Cloudflare)

4. **Node.js & npm** installed (you already have this)

---

## 🔧 Step-by-Step Deployment

### Step 1: Login to Cloudflare

```bash
# Login to Cloudflare account
wrangler login
```

This will open your browser to authenticate.

---

### Step 2: Create D1 Database (if not exists)

```bash
# Check if database exists
wrangler d1 list

# If not exists, create it
wrangler d1 create hrms-database
```

**Copy the database ID** from the output. It should look like:
```
database_id = "344fe95a-d6e9-4fcd-b331-601b5353d55f"
```

---

### Step 3: Update wrangler.jsonc

Your current `wrangler.jsonc` already has:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hrms-database",
      "database_id": "344fe95a-d6e9-4fcd-b331-601b5353d55f"
    }
  ]
}
```

✅ If the database_id matches your database, you're good!  
❌ If not, update it with your actual database ID.

---

### Step 4: Initialize Database Schema

```bash
# Initialize local database (for testing)
wrangler d1 execute hrms-database --local --file=./db/schema.sql

# Initialize remote database (production)
wrangler d1 execute hrms-database --remote --file=./db/schema.sql

# Add authentication schema
wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql

# Create admin user
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql
```

---

### Step 5: Test Locally

```bash
# Install dependencies
npm install

# Run local development with database
npm run dev:remote

# Or for fully local testing
npm run dev
```

Visit: http://localhost:4321

Try logging in with:
- Username: `admin`
- Password: `admin123`

---

### Step 6: Build for Production

```bash
# Build the application
npm run build
```

This creates the `dist/` folder with your production files.

---

### Step 7: Deploy to Cloudflare Pages

#### Option A: Deploy via Wrangler CLI (Recommended)

```bash
# Deploy to Cloudflare Pages
wrangler pages deploy dist

# Follow the prompts:
# - Project name: hrms-production (or your preferred name)
# - Branch: production
```

**Your live URL will be:**
```
https://hrms-production.pages.dev
```

#### Option B: Deploy via Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com/
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your **GitHub repository**
6. Configure build settings:

   ```
   Build command: npm run build
   Build output directory: dist
   ```

7. Add environment bindings:
   - Go to **Settings** → **Functions**
   - Add D1 binding:
     - Variable name: `DB`
     - D1 database: `hrms-database`

8. Click **Save and Deploy**

---

### Step 8: Configure Custom Domain (Optional)

If you have a custom domain:

1. Go to your Pages project in Cloudflare dashboard
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `hrms.yourcompany.com`)
5. Follow DNS configuration instructions
6. Wait for SSL certificate (automatic)

---

## 🗄️ Database Setup

After deployment, your database needs initial data:

### Verify Database

```bash
# Check if tables exist
wrangler d1 execute hrms-database --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check if admin user exists
wrangler d1 execute hrms-database --remote --command="SELECT * FROM users WHERE role='admin';"
```

### Create Test Data (Optional)

```bash
# Add sample employees
wrangler d1 execute hrms-database --remote --file=./db/setup-sample-hierarchy.sql

# Add sample attendance
npm run seed-attendance
```

---

## 🔐 Environment Variables & Secrets

If you have any secrets (API keys, etc.):

```bash
# Set secrets via Wrangler
wrangler pages secret put SECRET_NAME

# Or via Dashboard:
# Pages → Your Project → Settings → Environment variables
```

Current setup doesn't require secrets, but for future:
- Email service API keys
- Third-party integrations
- Encryption keys

---

## ✅ Post-Deployment Verification

Visit your deployed URL and test:

### 1. Basic Access
- [ ] Site loads without errors
- [ ] Login page appears
- [ ] No 404 errors in console

### 2. Authentication
- [ ] Login with admin credentials works
- [ ] Redirects to dashboard after login
- [ ] Session persists on refresh

### 3. API Endpoints
- [ ] `/api/auth/login` returns 200
- [ ] `/api/employees` returns data
- [ ] `/api/departments` returns data
- [ ] `/api/attendance` works

### 4. Database Operations
- [ ] Can view employees
- [ ] Can create new employee (auto-creates user)
- [ ] Can edit employee
- [ ] Can mark attendance

### 5. Features
- [ ] All 8 modules load
- [ ] Tables display data
- [ ] Forms work
- [ ] Modals open/close
- [ ] Search and filters work

---

## 🐛 Troubleshooting

### Issue 1: 404 on API Routes

**Symptoms:** `/api/auth/login` returns 404

**Solution:**
```bash
# Ensure build completed successfully
npm run build

# Check if _worker.js exists
ls dist/_worker.js

# Redeploy
wrangler pages deploy dist
```

### Issue 2: Database Not Connected

**Symptoms:** "Database not configured" error

**Solution:**
1. Verify D1 binding in Cloudflare dashboard
2. Check wrangler.jsonc has correct database_id
3. Redeploy with updated configuration

### Issue 3: Login Fails After Deployment

**Symptoms:** Can't login with admin credentials

**Solution:**
```bash
# Re-run auth schema on remote database
wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql

# Verify admin user exists
wrangler d1 execute hrms-database --remote --command="SELECT username, email FROM users WHERE role='admin';"

# If not exists, create admin
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql
```

### Issue 4: Build Fails

**Symptoms:** `npm run build` errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run astro check

# Try building again
npm run build
```

### Issue 5: Environment Shows Wrong URL

**Symptoms:** Base URL still points to localhost

**Solution:**
Update `src/lib/base-url.ts`:
```typescript
export const baseUrl = import.meta.env.DEV 
  ? 'http://localhost:4321' 
  : ''; // Empty string for production (uses relative URLs)
```

---

## 📊 Monitoring & Analytics

### Cloudflare Analytics

1. Go to your Pages project
2. Click **Analytics** tab
3. View:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Request errors

### Error Tracking

Monitor errors in Cloudflare Workers logs:
```bash
# View real-time logs
wrangler pages tail hrms-production
```

### Performance Monitoring

Check performance in Cloudflare dashboard:
- Response times
- Cache hit ratio
- Origin response time
- Error rates

---

## 🔄 Continuous Deployment

### Automatic Deployments

Once connected to GitHub:

1. Push to `main` branch → Auto-deploys to production
2. Push to `staging` branch → Auto-deploys to staging environment
3. Pull requests → Preview deployments

### Manual Deployment

```bash
# Deploy latest changes
npm run build
wrangler pages deploy dist

# Deploy to specific environment
wrangler pages deploy dist --branch=staging
```

---

## 📈 Scaling & Performance

### Free Tier Limits
- 500 requests/second
- 100,000 requests/day
- Unlimited bandwidth

### Paid Tier Benefits
- Higher request limits
- Priority support
- Advanced DDoS protection
- More D1 database storage

### Optimization Tips
1. Enable Cloudflare caching for static assets
2. Use D1 database indexes
3. Implement pagination for large datasets
4. Enable Cloudflare CDN
5. Use Cloudflare Images (if adding image uploads)

---

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Local development
npm run dev:remote       # Local with remote database
npm run build            # Production build
npm run preview          # Preview production build

# Database
wrangler d1 list                          # List databases
wrangler d1 execute DB --remote --command # Run SQL query
wrangler d1 info hrms-database           # Database info

# Deployment
wrangler pages deploy dist                # Deploy to Cloudflare
wrangler pages tail                       # View live logs
wrangler pages list                       # List projects

# Testing
npm run astro check                       # TypeScript check
```

---

## 📚 Additional Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Cloudflare D1 Docs:** https://developers.cloudflare.com/d1/
- **Astro + Cloudflare:** https://docs.astro.build/en/guides/deploy/cloudflare/
- **Wrangler CLI Docs:** https://developers.cloudflare.com/workers/wrangler/

---

## 🎯 Quick Start Checklist

- [ ] Create Cloudflare account
- [ ] Install wrangler CLI: `npm install -g wrangler`
- [ ] Login: `wrangler login`
- [ ] Create D1 database: `wrangler d1 create hrms-database`
- [ ] Update wrangler.jsonc with database_id
- [ ] Initialize database: `wrangler d1 execute hrms-database --remote --file=./db/schema.sql`
- [ ] Add auth schema: `wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql`
- [ ] Create admin user: `wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql`
- [ ] Build project: `npm run build`
- [ ] Deploy: `wrangler pages deploy dist`
- [ ] Test live URL
- [ ] Login with admin/admin123
- [ ] ✅ Done!

---

## 💡 Summary

❌ **Don't use Webflow** - It's for static websites, not full-stack apps  
✅ **Use Cloudflare Pages** - Built for SSR apps with databases  
✅ **Free tier available** - No credit card required to start  
✅ **Global CDN** - Fast worldwide performance  
✅ **Easy GitHub integration** - Auto-deploy on push  

Your live URL will be: **`https://[your-project-name].pages.dev`**

Need help? Check the troubleshooting section or reach out!
