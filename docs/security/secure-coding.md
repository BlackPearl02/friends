# Secure coding (Friends)

- Validate all external input (`class-validator` DTOs).
- Authorize every room/round/vote by `userId` + room membership (or host role).
- Minimize Prisma `select`; never return Discord access tokens or JWT in game DTOs.
- `activity/exchange` is `@Public()` but rate-limited; it is not harmless (account provision + token mint).
- Log events, not secrets. Redact `Authorization`, `code`, `access_token`.
- CORS: allow Activity origin / Discord embed needs; no `*` with credentials.
- HIGH/CRITICAL fixes need a regression test in the same PR.
