# Threat model (Friends)

## Assets

- Discord OAuth authorization codes and access tokens
- Friends JWT (maps to `User.id`)
- Game room state (votes, answers, scores) for an Activity instance
- Prompt catalog (not secret, but must not leak other rooms’ votes)

## Trust boundaries

1. Discord iframe (attacker-controlled client) → Nest API
2. Nest → Discord token endpoint / `@me`
3. Nest → Postgres (Prisma)
4. Discord URL mappings / proxy (`/api`)

## Invariants

- Activity identity is minted only after server-side code exchange + `/users/@me`.
- Room membership is scoped by authenticated user + server `instanceId` on the room, not client-supplied player lists as authz.
- Votes are write-once per (round, voter). Host cannot forge another player’s vote.
- Spicy prompts are a content pack, not a permission bypass.

## Out of primary scope

PlayGrid desktop, store OAuth, marketing www. Friends is Activity + API + DB only.
