---
name: friends-git-staging
description: >-
  Group dirty git changes into atomic conventional commits. Plan by repo area,
  detailed commit bodies, apply after one OK. Use when the user says commit,
  clean git queue, stage changes, posprzątaj gita.
---

# Friends git staging

## When this skill applies

- Mixed working tree (API + Activity + db + cursor)
- User wants atomic commits on one branch
- User says: commit, posprzątaj gita, zaplanuj commity

## Read first

1. [.cursor/rules/git-staging.mdc](../../rules/git-staging.mdc)
2. [commit-areas.json](../../../commit-areas.json)
3. `git log -3 --format=full` if history exists; otherwise PlayGrid-style `type(scope):` + body

## Workflow

1. `git status` — if clean, stop.
2. Group files by `commit-areas.json` prefixes.
3. For each group: `git diff -- <files>` → subject + 3–6 sentence body.
4. Show the plan. Wait for OK.
5. `git add` only that group, `git commit` with subject + body. Repeat.
6. Never `git push` unless asked.

**Subject:** `type(scope): imperative summary` (≤72 chars). Scopes: `activity`, `api`, `db`, `types`, `cursor`, `docs`.

## Never commit

`.env*`, secrets, `dist/`, `node_modules/`.
