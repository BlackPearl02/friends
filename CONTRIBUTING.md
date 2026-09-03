# Contributing

## Pull requests

1. Fork the repository (or use a branch on a collaborator clone).
2. Keep changes focused. Follow conventional commits: `type(scope): summary` with scopes such as `activity`, `api`, `db`, `types`, `docs`.
3. Run `pnpm test` locally. Business-logic and HTTP/UI contract changes need tests in the same PR ([docs/testing-strategy.md](docs/testing-strategy.md)).
4. Do not commit `.env*`, credentials, `dist/`, or `node_modules`.

## Secrets and tokens

Copy `.env.example` to `.env.development`. Fill Discord and JWT values locally. Never paste real secrets into issues, PRs, or screenshots.

## i18n

User-facing strings ship in English and Polish. No hardcoded UI copy in JSX.

## License

By contributing you agree that your work is licensed under the MIT License in this repository.
