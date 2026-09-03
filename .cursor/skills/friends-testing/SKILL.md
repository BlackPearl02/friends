---
name: friends-testing
description: >-
  Friends test strategy — Vitest unit, API integration with supertest. Use when
  adding features, fixing bugs, or when the user asks for tests, regresja, or CI.
---

# Friends testing

## When this skill applies

- New or changed: `apps/api`, `apps/activity`, `packages/*`
- User mentions: testy, unit, regresja, Vitest, CI

## Read first

1. [docs/testing-strategy.md](../../../docs/testing-strategy.md)
2. [.cursor/rules/testing.mdc](../../rules/testing.mdc)

## Execution order

1. Classify the change (table in `testing.mdc`).
2. Add colocated tests in the same PR.
3. Run the narrowest command; fix failures.
4. Document commands in the Test plan.

## Stack

| Package | Unit |
|---------|------|
| `@friends/api` | Vitest `*.spec.ts` + supertest for HTTP |
| `@friends/activity` | Vitest `*.test.ts` for helpers |
| `@friends/types` | Vitest if helpers exist |

HIGH/CRITICAL security fixes **MUST** include a regression test (`friends-security`).
