# `@friends/api`

NestJS REST for the Squimbo Discord Activity.

| Area | Path |
|------|------|
| JWT | `src/auth/` |
| Activity OAuth exchange + Interactions (`/play`) | `src/discord/` |
| Rooms / rounds / votes | `src/game/` |

Slash / App Launcher registration: `scripts/register-discord-activity-commands.mjs` (see `docs/discord-activity-setup.md`).

Identity is minted only after Discord code exchange. Room authz is membership (or host), never client-supplied Discord user ids.

Dev: `:3000` via `pnpm --filter @friends/api dev` (or root `pnpm dev`).
