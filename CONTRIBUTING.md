# Contributing

Local setup is in the [README](./README.md#local-setup). Product and ops docs are in `docs/`. Cursor rules and skills are in `.cursor/`.

## Pull requests

1. Fork the repository, or branch from a collaborator clone. Open PRs into `dev` (Vercel Preview). `main` is Production.
2. Keep the change focused. Commits: `type(scope): summary` (English, imperative). Scopes in this repo: `activity`, `api`, `web`, `db`, `types`, `docs`, `cursor`.
3. Run `pnpm test` locally. Business-logic, authz, and HTTP/UI contract changes need tests in the same PR ([docs/testing-strategy.md](docs/testing-strategy.md)).
4. Do not commit `.env*`, credentials, `dist/`, or `node_modules`.

`pnpm lint` runs `tsc --noEmit` in each package. CI on `main` runs `pnpm test`.

## Secrets

Copy `.env.example` to `.env.development` for local Docker. Production values live in gitignored `.env.production` and Vercel Production scope ([docs/deployment.md](docs/deployment.md#branches--environments)).

Never paste real secrets into issues, PRs, or screenshots. Vulnerability reports: [SECURITY.md](./SECURITY.md).

## i18n

User-facing Activity strings ship in English and Polish in the same change (`apps/activity/src/i18n/messages/en.ts` and `pl.ts`). No hardcoded UI copy in JSX. Code comments and module READMEs stay English.

## Bugs

Use the GitHub **Bug report** template. Do not attach `.env` files, JWT, Discord tokens, OAuth `code`, or database URLs.

## License

By contributing you agree that your work is licensed under the MIT License in this repository.
