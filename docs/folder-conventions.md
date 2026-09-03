# Folder conventions

| Kind | Where |
|------|--------|
| Discord Activity UI | `apps/activity/src/` |
| Activity i18n catalogs | `apps/activity/src/i18n/messages/{en,pl}.ts` |
| Nest module | `apps/api/src/<domain>/` (controller, service, dto, `*.spec.ts`) |
| Prisma | `packages/db/prisma/schema.prisma` + `migrations/` |
| Shared DTOs | `packages/types/src/` |
| Product / Discord ops | `docs/` |
| Agent constraints | `.cursor/rules/` (short) and `.cursor/skills/` (workflows) |

New user-facing strings: **en + pl** in the same change. English only in code comments and module READMEs.
