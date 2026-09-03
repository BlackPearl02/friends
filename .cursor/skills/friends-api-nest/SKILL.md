---
name: friends-api-nest
description: >-
  Friends NestJS API — modules, JWT guards, DTOs, Prisma, REST. Use when adding
  apps/api routes, controllers, services, guards, class-validator DTOs, or
  @Public() exceptions.
---

# Friends API (NestJS)

## When this skill applies

- Code under `apps/api/src/`
- User mentions: endpoint, Nest, controller, DTO, JWT, exchange, room, vote

## Read first

1. [apps/api/README.md](../../../apps/api/README.md)
2. Neighbor module in the same domain
3. [friends-prisma-db](../friends-prisma-db/SKILL.md) if schema changes
4. [friends-testing](../friends-testing/SKILL.md) + `api-appsec.mdc`

## Module map

| Module | Path | Responsibility |
|--------|------|----------------|
| Auth | `src/auth/` | JWT strategy, guards, mint after exchange |
| Discord | `src/discord/` | Activity OAuth exchange |
| Game | `src/game/` | Rooms, rounds, votes |

## Execution order

1. Module registered in `app.module.ts`
2. DTO with `class-validator`
3. Service: Prisma + `@CurrentUser()` `userId` / membership
4. Controller; `@Public()` only when truly anonymous
5. Types in `packages/types` aligned with response DTOs
6. Tests: `*.spec.ts`; `pnpm --filter @friends/api test`

## Do not

- Authorize from client-supplied Discord user ids
- Log Authorization headers
