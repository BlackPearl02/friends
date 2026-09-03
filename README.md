# Friends

Discord Activity — party game inspired by [Kumple](https://play.google.com/store/apps/details?id=com.kumple) (Buddies). Play in a Discord voice or text channel: questions, challenges, and “who is most likely” rounds without a join code.

Product name in Discord: **Friends**. Engineering package scope: `@friends/*`.

## Stack (mirrors PlayGrid)

| Package | Path | Role | Dev port |
|---------|------|------|----------|
| `@friends/api` | `apps/api` | NestJS — Activity OAuth exchange, rooms, rounds | **:3000** |
| `@friends/activity` | `apps/activity` | Discord Embedded App (Vite + React) | **:3003** |
| `@friends/db` | `packages/db` | Prisma + PostgreSQL |
| `@friends/types` | `packages/types` | Shared DTOs |

## Local setup

```bash
cp .env.example .env.development
# fill DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET / JWT_SECRET / VITE_DISCORD_CLIENT_ID

pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Discord rejects bare `localhost` Activity URL mappings. Tunnel Activity (`:3003`) and API (`:3000`) over HTTPS, then map `/` → Activity and `/api` → API in the Developer Portal. Details: [docs/discord-activity-setup.md](./docs/discord-activity-setup.md). Production: [docs/deployment.md](./docs/deployment.md) (Vercel + Supabase). Secrets never belong in git — only in local gitignored env files and the Vercel/Supabase dashboards. `DISCORD_CLIENT_ID` is public; `DISCORD_CLIENT_SECRET` and `JWT_SECRET` are not. Rotate them if they leak.

## License

[MIT](./LICENSE). See [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md).

## Product

See [docs/product.md](./docs/product.md) for the Kumple → Friends mapping (categories, round types, Discord-native lobby).

## Agent conventions

Cursor rules and skills live under `.cursor/` and follow the same split as PlayGrid: short mandatory rules, multi-step skills, long reference in `docs/`.
