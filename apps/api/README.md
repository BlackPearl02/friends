# `@friends/api`

NestJS REST for the Friends Discord Activity.

| Area | Path |
|------|------|
| JWT | `src/auth/` |
| Activity OAuth exchange | `src/discord/` |
| Rooms / rounds / votes | `src/game/` |

Identity is minted only after Discord code exchange. Room authz is membership (or host), never client-supplied Discord user ids.

Dev: `:3000` via `pnpm --filter @friends/api dev` (or root `pnpm dev`).
