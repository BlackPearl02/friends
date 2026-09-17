---
name: friends-docs
description: >-
  Writes GitHub and project documentation in a direct maintainer voice. Use when
  creating or editing README, CONTRIBUTING, LICENSE, SECURITY, docs/*.md, module
  READMEs, or when the user asks for dokumentacja, technical docs, or a docs
  rewrite.
---

# Squimbo documentation

You are writing as a maintainer who actually ships this repo. Direct, specific, useful. Not marketing. Not AI filler.

This skill is for **project documentation**. It is not for Activity UI copy (`friends-copywriting`), code comments (`code-documentation`), or commit messages (`friends-git-staging`).

## When this skill applies

- Root or package `README.md`, `CONTRIBUTING.md`, `LICENSE`, `SECURITY.md`
- Anything under `docs/`
- User asks to write, rewrite, or review documentation

## Read first

1. The file you are editing, if it exists.
2. [README.md](../../../README.md), [CONTRIBUTING.md](../../../CONTRIBUTING.md), [LICENSE](../../../LICENSE)
3. Canonical product facts: [docs/product.md](../../../docs/product.md)
4. Setup and deploy only if the doc covers them: [docs/discord-activity-setup.md](../../../docs/discord-activity-setup.md), [docs/deployment.md](../../../docs/deployment.md)
5. Style rules in [style.md](style.md) (banned phrases, README/CONTRIBUTING/LICENSE shapes, QA checklist)

Do not invent features, commands, env vars, ports, licenses, authors, or behavior. If a fact is missing, mark the gap or ask. Do not fill holes with guesses.

## Workflow

1. Identify the audience and the question the doc must answer.
2. Collect facts from the repo (files above, source, existing scripts). Treat `docs/product.md` and package READMEs as source of truth over memory.
3. Choose only the sections that this document needs. Do not paste a generic README template.
4. Write. Every sentence must carry a fact or an instruction.
5. Run the QA checklist in [style.md](style.md).
6. Return **only the finished document**, unless the user also asked for an explanation of changes or assumptions.

## What a new reader needs

In this order, if the document type calls for it:

1. What this is
2. What it is for
3. How to run it
4. How to use it
5. Where the rest of the detail lives

## Squimbo facts (do not contradict)

Use these only when the document needs them. Do not dump them into every file.

- Product: Discord Activity party game. Room key is the Activity `instanceId`. Marketing site: squimbo.app. Packages remain `@friends/*`.
- Ports: API `:3000`, web `:3001`, activity `:3003`.
- Local: `pnpm` 9+, root `.env.development` (or `.env`) via `scripts/with-friends-env.mjs`. Postgres via `pnpm db:up` (host **15433**).
- Required env names (values never belong in docs): `DATABASE_URL`, `JWT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`. Public vs secret: `DISCORD_CLIENT_ID` is public; `DISCORD_CLIENT_SECRET` and `JWT_SECRET` are not.
- Branches: PRs into `dev` (Preview). `main` is Production. Details in `docs/deployment.md`.
- License: MIT (`LICENSE`). Copyright line is already in that file. Do not rewrite `LICENSE` unless the user asks for a specific license text.
- Engineering docs and module READMEs: **English**. User-facing product UI: en + pl (`friends-i18n`). If the user asks for a Polish doc, write natural Polish technical prose (keep terms that stay English in practice: README, endpoint, commit, PR).
- Do not copy third-party party-game question banks, assets, or brands. Do not document PlayGrid library / sessions / store OAuth as Squimbo features.

Module README: architecture map (what lives where, authz, how to run that package). Not a file inventory.

## Document types

| Kind | Do |
|------|-----|
| README | Only sections the project actually needs. Commands and paths from this repo. |
| `docs/` technical | Answer a concrete question. Inputs, outputs, limits, examples, failure modes. Skip implementation unless it is required to use the thing. |
| API | Real endpoints, HTTP methods, params, responses, examples. Authz is membership/host, not “the client said so”. |
| Configuration | Real variable names, types, defaults, required vs optional. Never paste secret **values**. |
| CONTRIBUTING | Mirror [CONTRIBUTING.md](../../../CONTRIBUTING.md). Do not invent extra process (code owners, CoC boards, chat servers) that the repo does not have. |
| LICENSE | If asked to create one: identify the license first. Use the standard legal text. Do not paraphrase a license. Current repo license is MIT. |
