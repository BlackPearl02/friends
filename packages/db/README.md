# @friends/db

PostgreSQL via Prisma. Schema domains: identity (`User`), match (`GameRoom`, `RoomPlayer`), catalog (`Prompt`), play (`Round`, `Vote`).

Commands from repo root: `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:generate`.

Authz lives in Nest — do not treat the database as the authorization layer.
