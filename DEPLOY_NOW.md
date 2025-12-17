# 🚀 Quick Deployment Commands

## ⚡ Deploy Your HRMS to Cloudflare Pages (Not Webflow!)

### 🎯 One-Time Setup (5 minutes)

```bash
# 1. Install Wrangler CLI (Cloudflare's tool)
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Check if database exists
wrangler d1 list

# 4. If database doesn't exist, create it
wrangler d1 create hrms-database

# 5. Initialize database with schema
wrangler d1 execute hrms-database --remote --file=./db/schema.sql
wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql
```

### 🚀 Deploy to Production

```bash
# Build your application
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist
```

**That's it!** Your app will be live at: `https://[project-name].pages.dev`

---

## 🔄 Update Deployment

Every time you make changes:

```bash
# 1. Build
npm run build

# 2. Deploy
wrangler pages deploy dist
```

---

## 🧪 Test Before Deploying

```bash
# Test locally with remote database
npm run dev:remote

# Visit: http://localhost:4321
# Login: admin / admin123
```

---

## ✅ Verify Database Setup

```bash
# Check tables exist
wrangler d1 execute hrms-database --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check admin user exists
wrangler d1 execute hrms-database --remote --command="SELECT username, email, role FROM users WHERE role='admin';"
```

---

## 🐛 If Something Goes Wrong

### Problem: Can't login after deployment

```bash
# Re-create admin user
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql
```

### Problem: Database errors

```bash
# Re-run all database setup
wrangler d1 execute hrms-database --remote --file=./db/schema.sql
wrangler d1 execute hrms-database --remote --file=./db/auth-schema.sql
wrangler d1 execute hrms-database --remote --file=./db/create-admin-hr-users.sql
```

### Problem: Build fails

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📊 Monitor Your Live Site

```bash
# View real-time logs
wrangler pages tail

# List all deployments
wrangler pages deployments list

# View deployment info
wrangler pages deployment list
```

---

## 🔗 Important URLs

- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Your Live Site:** https://[project-name].pages.dev
- **Login Credentials:** 
  - Username: `admin`
  - Password: `admin123`

---

## ❌ Why Not Webflow?

**Webflow Error You're Getting:**
```
POST https://yogeshs-ultra-awesome-site-d54a59.webflow.io/api/auth/login 405 (Method Not Allowed)
```

**Reason:** Webflow is a static website builder. Your HRMS needs:
- ✅ Server-side API routes → **Webflow: ❌ Not supported**
- ✅ Database (D1) → **Webflow: ❌ Not supported**
- ✅ POST/PUT/DELETE requests → **Webflow: ❌ Not supported**

**Solution:** Deploy to **Cloudflare Pages** instead (built for this!)

---

## 📞 Need Help?

1. Check [CLOUDFLARE_DEPLOYMENT_GUIDE.md](CLOUDFLARE_DEPLOYMENT_GUIDE.md) for detailed steps
2. Check Cloudflare Docs: https://developers.cloudflare.com/pages/
3. View your project logs: `wrangler pages tail`

---

## ✨ Pro Tips

1. **Automatic Deployments:** Connect GitHub to Cloudflare Pages for auto-deploy on push
2. **Custom Domain:** Add your own domain in Cloudflare dashboard (free SSL included)
3. **Multiple Environments:** Use branches for staging and production
4. **Free Tier:** 100,000 requests/day on free plan (more than enough to start!)

---

**Ready to deploy? Run these 3 commands:**

```bash
wrangler login
npm run build
wrangler pages deploy dist
```

**You'll be live in 2 minutes! 🎉**
