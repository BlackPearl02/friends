# Repo structure

```
friends/
  apps/
    activity/     Discord Embedded App (Vite + React) — :3003
    api/          NestJS REST — :3000
  packages/
    db/           Prisma schema, migrations, seed
    types/        Shared request/response types
  docs/           Product, strategy, roadmap, metrics, Discord setup, AppSec, testing
  .cursor/        Rules + skills (PlayGrid-shaped)
  scripts/        with-friends-env.mjs
```

Package manager: **pnpm** 9+ workspaces. Orchestration: **Turborepo**.

Env lives at repo root (`.env.development`). Apps load it through `scripts/with-friends-env.mjs`. Do not scatter `.env` files under `apps/*`.
