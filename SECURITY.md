# Security policy

## Reporting a vulnerability

Email **sziti124@gmail.com** with a description of the issue, affected paths, and steps to reproduce.

Do **not** open a public GitHub issue or pull request with a working exploit, Discord tokens, JWT values, OAuth codes, or database connection strings.

We will acknowledge reports and, when a fix ships, credit you if you want that.

## Secrets

Never commit:

- `.env`, `.env.development`, `.env.production`, `.env*.local`
- `DISCORD_CLIENT_SECRET`, `JWT_SECRET`, Discord access/refresh tokens, OAuth `code`
- Supabase / Postgres URLs with passwords

Use `.env.example` (and `.env.production.example` locally, gitignored production file) as templates. Production secrets live in Vercel and Supabase dashboards only.

`DISCORD_CLIENT_ID` / `VITE_DISCORD_CLIENT_ID` are public identifiers, not secrets.

If a secret was pasted into chat, a gist, or git history, **rotate it** in Discord Developer Portal / generate a new JWT secret / reset the database password before the next deploy.
