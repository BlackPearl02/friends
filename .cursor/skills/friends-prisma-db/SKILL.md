---
name: friends-prisma-db
description: >-
  Friends Prisma schema, migrations, seed — PostgreSQL via @friends/db. Use when
  changing schema.prisma, models, migrations, db:seed, or Prisma queries for
  User, GameRoom, Round, Prompt, Vote.
---

# Friends Prisma & database

## Read first

1. [packages/db/README.md](../../../packages/db/README.md)
2. `packages/db/prisma/schema.prisma`
3. Prisma plugin: `schema-conventions`, `migration-best-practices`

## Domain → API

| Domain | Models | API |
|--------|--------|-----|
| Identity | `User` (`discordId`) | `discord/`, `auth/` |
| Match | `GameRoom`, `RoomPlayer` | `game/` |
| Catalog | `Prompt` | seed + `game/` |
| Play | `Round`, `Vote` | `game/` |

## Execution order

1. Align names with existing schema; both sides of relations; `createdAt`/`updatedAt`.
2. Edit `schema.prisma`; `pnpm db:migrate` from root (not `db:push` for prod-bound changes).
3. Update Nest services; always scope by authenticated user / membership.
4. Seed prompts in **en and pl** when adding kinds/categories.
5. Tests per `friends-testing`.

## Commands

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm db:generate
```
