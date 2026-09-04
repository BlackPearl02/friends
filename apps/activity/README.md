# Discord Activity (`@friends/activity`)

Vite + React Embedded App on **:3003**. Party game lobby and rounds for Friends.

## Does not own

- Nest exchange / rooms — `apps/api`
- Prompt catalog — `packages/db` seed

## Invariants

- Discord rejects bare `localhost` mappings — use HTTPS tunnels.
- Identity after `activity/exchange` is server-derived.
- Inside the iframe, API calls go to `/api/...` (Developer Portal mapping). Vite dev proxy strips `/api` toward Nest `:3000`.
- Room sync is REST polling every **750 ms** (`ROOM_POLL_MS` in `src/roomSync.ts`), skipping overlapping fetches. Mutation responses update the acting client immediately; others catch up on the next poll. No WebSockets yet.

## Start

`src/main.tsx` → auth → `LobbyPanel` / `RoundPanel`. i18n: `src/i18n/`.
