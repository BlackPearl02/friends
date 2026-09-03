# Deployment — Friends

**Stack:** Vercel (Activity + API) + Supabase (PostgreSQL).  
**Dev stack:** Vite :3003 + Nest :3000 + Docker Postgres :15433.

---

## 1. Supabase — hosted database (once)

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database**.
3. Copy two connection strings:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL`
   - **Direct connection** (port `5432`) → `DIRECT_URL`
4. Add `?pgbouncer=true` to `DATABASE_URL` (required for Prisma with PgBouncer).
5. Run migrations against production DB (once):
   ```powershell
   # Fill in .env.production first (copy from .env.production.example)
   $env:NODE_ENV="production"
   pnpm --filter @friends/db db:migrate
   pnpm --filter @friends/db db:seed
   ```

---

## 2. Vercel — Activity (frontend)

**Root directory:** `apps/activity`

`vercel.json` is already present — Vercel picks it up automatically.

### Environment variables (Vercel dashboard → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `VITE_DISCORD_CLIENT_ID` | Discord Client ID |
| `VITE_FRIENDS_API_URL` | *(leave empty — URL mapping handles `/api`)* |

### Deploy command (or use Vercel dashboard → Import Git)
```bash
vercel --cwd apps/activity
```

Note the deployed URL, e.g. `https://friends-activity.vercel.app`.

---

## 3. Vercel — API (backend)

**Root directory:** `apps/api`

`vercel.json` is already present. The serverless entry point is `api/index.ts`.

### Environment variables (Vercel dashboard → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URL (with `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct URL |
| `JWT_SECRET` | Same secret as `.env.development` (or new prod secret) |
| `DISCORD_CLIENT_ID` | Discord Client ID |
| `DISCORD_CLIENT_SECRET` | Discord Client Secret |
| `DISCORD_ACTIVITY_REDIRECT_URI` | *(leave empty — handler tries `.discordsays.com` automatically)* |
| `API_PUBLIC_URL` | `https://friends-api.vercel.app` (your API Vercel URL) |
| `ACTIVITY_ORIGIN` | `https://friends-activity.vercel.app` (your Activity Vercel URL) |

### Deploy command
```bash
vercel --cwd apps/api
```

Note the deployed URL, e.g. `https://friends-api.vercel.app`.

---

## 4. Discord Developer Portal — URL Mappings (once)

After both Vercel deployments are live, set in **Developer Portal → Activities → URL Mappings**:

| Mapping | Prefix | Target |
|---|---|---|
| Root Mapping | `/` | `https://friends-activity.vercel.app` |
| Proxy Path Mapping | `/api` | `https://friends-api.vercel.app` |

**OAuth2 → Redirects** must include:
- `https://<CLIENT_ID>.discordsays.com`

These values never change after initial setup — no tunnels, no manual restart.

---

## 5. Local development (no change needed)

```powershell
pnpm db:up        # Docker Postgres :15433
pnpm db:migrate
pnpm db:seed
pnpm dev          # API :3000 + Activity :3003
```

`.env.development` uses `127.0.0.1:15433` — unchanged.

For Discord iframe testing locally you still need a temporary tunnel (see [discord-activity-setup.md](./discord-activity-setup.md)), but the Vercel prod deployment removes that need for actual users.

---

## Quick reference — env per environment

| Variable | Local dev | Vercel API | Vercel Activity |
|---|---|---|---|
| `DATABASE_URL` | Docker :15433 | Supabase pooler | — |
| `DIRECT_URL` | Docker :15433 | Supabase direct | — |
| `JWT_SECRET` | `.env.development` | Vercel env | — |
| `DISCORD_CLIENT_ID` | `.env.development` | Vercel env | — |
| `DISCORD_CLIENT_SECRET` | `.env.development` | Vercel env | — |
| `API_PUBLIC_URL` | `http://localhost:3000` | Vercel URL | — |
| `ACTIVITY_ORIGIN` | `http://localhost:3003` | Activity Vercel URL | — |
| `VITE_DISCORD_CLIENT_ID` | `.env.development` | — | Vercel env |
| `VITE_FRIENDS_API_URL` | *(empty)* | — | *(empty)* |
