# Deployment — Squimbo

Engineering packages remain `@friends/*`. Product / Discord name: **Squimbo**. Marketing: **squimbo.app**.

**Stack:** Vercel (Activity + API + Web) + Supabase (PostgreSQL) + Cloudflare Workers PartyServer (room WebSocket push).  
**Dev stack:** Vite :3003 + Nest :3000 + Next :3001 + Docker Postgres :15433 (+ optional `pnpm --filter @friends/party dev`).

This repository is public. Treat git as source-only: no real secrets in commits, issues, or CI logs. `DISCORD_CLIENT_ID` / `VITE_DISCORD_CLIENT_ID` may appear in the Activity bundle; `DISCORD_CLIENT_SECRET`, `JWT_SECRET`, and database URLs must live only in Vercel, Supabase, and gitignored `.env.development` / `.env.production`. If a secret leaks, rotate it before the next deploy.

---

## Branches & environments

| Layer | Git | Config source | Database |
|---|---|---|---|
| Local staging | `dev` (or any local branch) | Root `.env.development` via `scripts/with-friends-env.mjs` | Docker Postgres `:15433` (`pnpm db:up`) |
| Vercel Preview | `dev` + PR branches | Vercel env scope **Preview** | Same Supabase as Production (no second project) — smoke URLs only, not a data sandbox |
| Vercel Production | `main` | Vercel env scope **Production** (values from local `.env.production`) | Supabase prod |

**Production Branch** on `friends-api`, `friends-web`, and `friends-activity` is `main`. Push to `main` → Production deploy; push to `dev` / open a PR → Preview deploy.

Vercel never reads `.env.development` / `.env.production` from git (those files stay gitignored). Sync secrets with the Vercel dashboard or `vercel env add` / `vercel env ls` per project (`apps/api`, `apps/web`, `apps/activity`).

**Important:** Preview cannot reach local Docker. Isolated staging data lives only on your machine. Without a separate hosted staging DB, Preview API shares Production Supabase — treat Preview as build/URL smoke, not a safe place for destructive data experiments. Discord URL Mappings stay pointed at Production Activity/API URLs.

Typical flow: feature branch → PR into `dev` (Preview) → merge `dev` → `main` (Production).

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

Set separately for **Production** and **Preview** (same Client ID is fine).

| Variable | Value |
|---|---|
| `VITE_DISCORD_CLIENT_ID` | Discord Client ID |
| `VITE_FRIENDS_API_URL` | *(leave empty — URL mapping handles `/api`)* |
| `VITE_PARTYKIT_HOST` | `/party` (Discord maps `/party` → your party Worker host) |

PartyServer WebSocket push delivers safe public patches (vote/intent/roster). The Activity still refetches `GET /game/rooms/current` for authoritative state. Without `VITE_PARTYKIT_HOST` it falls back to 750ms polling alone.

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

Add each variable twice: once for **Production**, once for **Preview**. Preview may reuse Production Supabase / Discord secrets until a hosted staging DB exists. Do **not** attach local Docker URLs to Preview.

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URL (with `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct URL |
| `JWT_SECRET` | Prod secret from `.env.production` (prefer distinct from local `.env.development`) |
| `DISCORD_CLIENT_ID` | Discord Client ID |
| `DISCORD_CLIENT_SECRET` | Discord Client Secret |
| `DISCORD_ACTIVITY_REDIRECT_URI` | *(leave empty — handler tries `.discordsays.com` automatically)* |
| `API_PUBLIC_URL` | `https://friends-api-five.vercel.app` (your API Vercel URL) |
| `ACTIVITY_ORIGIN` | `https://friends-activity.vercel.app` (your Activity Vercel URL) |
| `PARTYKIT_HOST` | `https://squimbo-party.<subdomain>.workers.dev` (Nest notify target) |
| `PARTY_SERVER_SECRET` | Shared secret for Nest → party Worker HTTP notify (never ship to Activity) |

Room sync still works without PartyKit (HTTP poll only).

### Deploy command
```bash
vercel --cwd apps/api
```

Note the deployed URL, e.g. `https://friends-api.vercel.app`.

After the API is live: confirm Discord URL mappings (`/` → Activity, `/api` → API, `/party` → party Worker). Ensure the Activity **Entry Point** exists (`node scripts/register-discord-activity-entrypoint.mjs`). Leave Interactions Endpoint empty and do not invite as a bot on player servers. See [discord-activity-setup.md](./discord-activity-setup.md).

---

## 3b. PartyKit-compatible room push (Cloudflare Workers)

**Package:** `apps/party` (`@friends/party`) — PartyServer Durable Object with PartyKit-style paths (`/parties/main/:instanceId`).

Managed `*.partykit.dev` deploys currently fail (shared zone custom-domain limit). Deploy to your Cloudflare account instead:

```powershell
cd apps/party
pnpm deploy
npx wrangler secret put PARTY_SERVER_SECRET
```

Note the workers.dev host, e.g. `https://squimbo-party.<subdomain>.workers.dev`.

Current production fan-out (claim/migrate to your Cloudflare account if this was a preview deploy):

`https://squimbo-party.utopian-lead.workers.dev`

1. Vercel API: `PARTYKIT_HOST` = that https URL; `PARTY_SERVER_SECRET` = same secret as Wrangler.
2. Vercel Activity: `VITE_PARTYKIT_HOST=/party`.
3. Discord URL Mapping: `/party` → `squimbo-party.<subdomain>.workers.dev` (**omit** `https://`).

Nest awaits an HTTP notify after vote/intent/join/leave/replay. Activities receive the safe public patch over WebSocket, then refetch JWT room state. Polling every 750ms remains the safety net.

---

## 4. Vercel — Web (marketing)

**Root directory:** `apps/web`

`vercel.json` is already present. Next.js is detected automatically.

### Environment variables (Vercel dashboard → Settings → Environment Variables)

| Variable | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord Client ID (App Directory / discovery CTA) | Same |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional inbox for Privacy / Terms contact lines | Same (optional) |
| `NEXT_PUBLIC_SUPPORT_DISCORD_URL` | Discord invite on Support (defaults to community invite if unset) | Same (optional) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, no trailing slash (`https://squimbo.app`) — metadata, sitemap, Open Graph, `llms.txt` | Omit (Preview should not claim the canonical marketing origin) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project token (`phc_…`) for the Squimbo / Friends marketing project (EU cloud) | Same |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` | Same |

Also enable **Vercel Web Analytics** on the `friends-web` project (Dashboard → Analytics, or run interactively: `vercel project web-analytics enable friends-web --scope blackpearls-projects-c2dca206`). The app already mounts `@vercel/analytics`.

### PostHog (recommended)

Provision a dedicated PostHog org/project via Vercel Marketplace (creates env vars automatically):

```bash
# Once (interactive): accept marketplace terms
# https://vercel.com/blackpearls-projects-c2dca206/~/integrations/accept-terms/posthog?source=cli

vercel link --yes --scope blackpearls-projects-c2dca206 --project friends-web --cwd apps/web
vercel --scope blackpearls-projects-c2dca206 --cwd apps/web integration add posthog -m data_region=EU --plan posthog-usage-based --name squimbo-web
```

Do **not** reuse the PlayGrid PostHog project for Squimbo marketing traffic.

### Deploy command
```bash
vercel --cwd apps/web
```

Note the deployed URL, e.g. `https://friends-web.vercel.app`. Point Discord Developer Portal Website / Privacy / Terms / Support at `/en/...` paths — see [discord-activity-setup.md](./discord-activity-setup.md).

---

## 5. Discord Developer Portal — URL Mappings (once)

After both Vercel deployments are live, set in **Developer Portal → Activities → URL Mappings**:

| Mapping | Prefix | Target |
|---|---|---|
| Root Mapping | `/` | `friends-activity.vercel.app` |
| Proxy Path Mapping | `/api` | `friends-api-five.vercel.app` |
| Proxy Path Mapping | `/party` | `squimbo-party.<subdomain>.workers.dev` |

`/party` is required for PartyServer WebSocket push inside the Discord iframe (Discord only allows mapped hosts). **Omit `https://` in the target** — Discord picks the scheme from the request.

**OAuth2 → Redirects** must include:
- `https://<CLIENT_ID>.discordsays.com`

These values never change after initial setup — no tunnels, no manual restart.

---

## 6. Local development

```powershell
pnpm db:up        # Docker Postgres :15433
pnpm db:migrate
pnpm db:seed
pnpm dev          # API :3000 + Activity :3003 + Web :3001
```

`.env.development` uses `127.0.0.1:15433` — unchanged.

For Discord iframe testing locally you still need a temporary tunnel (see [discord-activity-setup.md](./discord-activity-setup.md)), but the Vercel prod deployment removes that need for actual users.

---

## Quick reference — env per environment

| Variable | Local (`.env.development`) | Vercel API Production / Preview | Vercel Activity | Vercel Web |
|---|---|---|---|---|
| `DATABASE_URL` | Docker :15433 | Supabase pooler (shared on Preview) | — | — |
| `DIRECT_URL` | Docker :15433 | Supabase direct (shared on Preview) | — | — |
| `JWT_SECRET` | local secret | Vercel Production + Preview scopes | — | — |
| `DISCORD_CLIENT_ID` | local / Discord app | Vercel Production + Preview | — | — |
| `DISCORD_CLIENT_SECRET` | local | Vercel Production + Preview | — | — |
| `API_PUBLIC_URL` | `http://localhost:3000` | Production API URL (Preview may reuse) | — | — |
| `ACTIVITY_ORIGIN` | `http://localhost:3003` | Production Activity URL (Preview may reuse) | — | — |
| `VITE_DISCORD_CLIENT_ID` | local | — | Production + Preview | — |
| `VITE_FRIENDS_API_URL` | *(empty)* | — | *(empty)* | — |
| `VITE_PARTYKIT_HOST` | `/party` or full workers.dev URL for browser mock | — | `/party` | — |
| `PARTYKIT_HOST` | optional (local party Worker) | Production + Preview | — | — |
| `PARTY_SERVER_SECRET` | optional | Production + Preview | — | — |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | falls back to Discord client id | — | — | Production + Preview |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | optional | — | — | Production + Preview |
| `NEXT_PUBLIC_SUPPORT_DISCORD_URL` | optional (community invite default in code) | — | — | Production + Preview |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` (or unset) | — | — | Production only (`https://squimbo.app`) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | optional (empty = no init) | — | — | Production + Preview |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` | — | — | Production + Preview |
