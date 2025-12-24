# 🤖 Copilot & AI Agent Instructions for HRMS

## 🏗️ Project Overview
- **Framework:** Astro (SSR) + React + Tailwind CSS
- **Deployment:** Cloudflare Pages (production), Cloudflare Workers (API), D1 Database
- **Key Directories:**
  - `src/` — App logic, components, API routes
  - `db/` — SQL schema, migration scripts
  - `generated/` — Webflow/Devlink generated files
  - `public/` — Static assets
  - `wrangler.jsonc` — Cloudflare config (bindings, env, D1)

## 🗺️ Architecture & Data Flow
- **Astro** handles SSR and routes; React used for UI components.
- **API endpoints** in `src/pages/api/` interact with D1 DB via `src/lib/db.ts`.
- **Email** via EmailJS REST API (`src/lib/email-service.ts`).
- **Database**: Cloudflare D1, schema in `db/schema.sql`.
- **Bindings:** D1 DB is always bound as `DB` (see `wrangler.jsonc`).

## 🛠️ Developer Workflows
- **Local dev:** `npm run dev` (local DB), `npm run dev:remote` (remote DB)
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Deploy:** `wrangler pages deploy dist`
- **DB setup:** `npm run db:setup:live` (PowerShell), or see `DATABASE_SETUP.md`
- **Type generation:** `npm run cf-typegen`
- **Test API:** Start dev server, then use `curl` or browser on `/api/*` endpoints

## ⚡ Project Conventions
- **D1 DB binding** must be named `DB` (uppercase) in all configs and code
- **Environment config**: Use `EMAIL_CONFIG` for email, secrets via Wrangler
- **Error logging:** Use `console.error` for API/server errors
- **Component structure:**
  - UI: `src/components/ui/`
  - Dashboard: `src/components/Dashboard/`
- **No direct DB access in UI components** — always use API endpoints
- **All deployments use Cloudflare Pages, not Webflow**

## 🔗 Integration & External Services
- **Email:** EmailJS REST API (see `src/lib/email-service.ts`)
- **Cloudflare D1:** All DB ops via `src/lib/db.ts` and SQL in `db/`
- **Webflow:** Only for static asset generation (`generated/`)

## 🧩 Examples
- **Password reset email:** See `src/lib/email-service.ts`
- **DB schema changes:** Edit `db/schema.sql`, run `wrangler d1 execute ...`
- **API endpoint:** See `src/pages/api/` for structure

## 🆘 Troubleshooting
- **DB not found:** `npm run db:init:local`
- **Type errors:** `npm run cf-typegen`
- **API 500:** Check DB binding/config, logs via `wrangler pages tail`

## 📚 Key Docs
- `README.md`, `DATABASE_SETUP.md`, `CLOUDFLARE_DEPLOYMENT_GUIDE.md`, `DEPLOY_NOW.md`, `DATABASE_CONFIG.md`

---

For more, see in-repo docs or ask for specific workflow details.
