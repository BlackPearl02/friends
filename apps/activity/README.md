# Discord Activity (`@friends/activity`)

Vite + React Embedded App on **:3003**. Party game lobby and rounds for Friends.

## Does not own

- Nest exchange / rooms — `apps/api`
- Prompt catalog — `packages/db` seed

## Invariants

- Discord rejects bare `localhost` mappings — use HTTPS tunnels.
- Identity after `activity/exchange` is server-derived.
- Inside the iframe, API calls go to `/api/...` (Developer Portal mapping). Vite dev proxy strips `/api` toward Nest `:3000`.

## Start

`src/main.tsx` → auth → `LobbyPanel` / `RoundPanel`. i18n: `src/i18n/`.
