---
name: friends-game-design
description: >-
  Friends party-game design — Kumple-inspired categories, round kinds, scoring,
  reveal rules. Use when adding prompts, rounds, lobby flow, or changing how
  votes and challenges work.
---

# Friends game design

## Read first

[docs/product.md](../../../docs/product.md) and [friends-game.mdc](../../rules/friends-game.mdc).

## Loop

1. Players open the Activity → same `instanceId` room
2. Host picks category → `start`
3. API serves a prompt unused in this room
4. Players act (`vote` / `choice` / `complete` / `skip`)
5. Host or timer → `reveal` → scores → next round

## Constraints

- Original prompts only (en+pl rows)
- `spicy` is a pack flag, not unrestricted PII fishing — keep it party-game, not harassment
- Skip is first-class on challenges
- Reveal is a server state, not a client toggle

When adding a kind: schema enum (if any) + API + Activity UI + seed prompts + tests.
