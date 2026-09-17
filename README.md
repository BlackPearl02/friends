# Squimbo

Discord Activity party game. Open it in a voice or text channel and play “who is most likely” with whoever is already there. The Activity `instanceId` is the room.

Product name in Discord: **Squimbo**. Marketing site: [squimbo.app](https://squimbo.app). Engineering packages still use the `@friends/*` scope.

## Packages

| Package | Path | Role | Dev |
|---------|------|------|-----|
| `@friends/api` | `apps/api` | NestJS: Activity OAuth exchange, rooms, rounds | `:3000` |
| `@friends/web` | `apps/web` | Marketing site (Next.js): landing and legal | `:3001` |
| `@friends/activity` | `apps/activity` | Discord Embedded App (Vite + React) | `:3003` |
| `@friends/party` | `apps/party` | Cloudflare Worker: WebSocket room push | |
| `@friends/db` | `packages/db` | Prisma + PostgreSQL | |
| `@friends/types` | `packages/types` | Shared DTOs | |

Room WebSocket push is optional. Without it the Activity falls back to HTTP polling.

## Requirements

- [pnpm](https://pnpm.io) 9+
- Docker (local Postgres)
- A Discord application with Activities enabled, to play inside Discord

CI uses Node 22.

## Local setup

```bash
cp .env.example .env.development
# fill DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, JWT_SECRET, VITE_DISCORD_CLIENT_ID

pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm db:up` starts Postgres on `127.0.0.1:15433`. Apps load root env through `scripts/with-friends-env.mjs`. Do not add `.env` files under `apps/*`.

Discord rejects bare `localhost` Activity URL mappings. Tunnel the Activity (`:3003`) and API (`:3000`) over HTTPS, then in the Developer Portal map `/` to the Activity and `/api` to the API. Details: [docs/discord-activity-setup.md](./docs/discord-activity-setup.md). Production (Vercel + Supabase): [docs/deployment.md](./docs/deployment.md).

## Configuration

Copy `.env.example` to `.env.development`. Needed for local API auth and Discord exchange:

- `DATABASE_URL` and `DIRECT_URL`
- `JWT_SECRET`
- `DISCORD_CLIENT_ID` and `VITE_DISCORD_CLIENT_ID` (public)
- `DISCORD_CLIENT_SECRET` (secret)

Do not commit `.env*`, `DISCORD_CLIENT_SECRET`, `JWT_SECRET`, or database URLs with passwords. Rotate them if they leak. See [SECURITY.md](./SECURITY.md).

## Branches

- `dev`: local `.env.development` + Docker Postgres. Pushes and PRs deploy as Vercel Preview.
- `main`: Vercel Production (Production env scope).

Typical flow: PR into `dev`, then merge `dev` to `main`. Preview shares Production Supabase, so treat it as a URL smoke check, not a data sandbox. See [Branches and environments](./docs/deployment.md#branches--environments).

## Tests

```bash
pnpm test
pnpm --filter @friends/api test
pnpm --filter @friends/activity test
```

[docs/testing-strategy.md](./docs/testing-strategy.md)

## Docs

- Product: [docs/product.md](./docs/product.md)
- Launch (domain + Discord): [docs/squimbo-launch-checklist.md](./docs/squimbo-launch-checklist.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

[MIT](./LICENSE).
