# Testing strategy

Business logic, authz, and HTTP/UI contracts ship with a test in the same PR.

## Where tests live

| Path | Runner | File |
|------|--------|------|
| `apps/api/src/**` services, validators | Vitest | colocated `*.spec.ts` |
| `apps/api` new endpoint / guard | Vitest + supertest | `apps/api/test/integration/` or colocated |
| `packages/types` / pure helpers | Vitest | `*.test.ts` |
| `apps/activity/src/**` helpers | Vitest | colocated `*.test.ts` |

Skip: DTO-only types, layout with no logic, generated Prisma client. Note why in the PR.

## Commands

```bash
pnpm test
pnpm --filter @friends/api test
pnpm --filter @friends/activity test
```

Names of tests: English. One `it` = one behavior. Never assert JWT, Discord access tokens, or secrets in snapshots.

Power prompt for a subagent: read `.cursor/skills/friends-testing/SKILL.md`, classify the diff with `.cursor/rules/testing.mdc`, add the test, run the narrowest command.
