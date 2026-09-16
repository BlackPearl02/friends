# `@friends/api`

NestJS REST for the Squimbo Discord Activity.

| Area | Path |
|------|------|
| JWT | `src/auth/` |
| Activity OAuth exchange | `src/discord/` |
| Rooms / rounds / votes | `src/game/` |

Identity is minted only after Discord code exchange. Room authz is membership (or host), never client-supplied Discord user ids.

Launch uses a Discord **Entry Point** command (`DISCORD_LAUNCH_ACTIVITY`) so the Activity opens from the launcher — no slash `/play`, no bot invite in player guilds. See `docs/discord-activity-setup.md`.

Dev: `:3000` via `pnpm --filter @friends/api dev` (or root `pnpm dev`).
