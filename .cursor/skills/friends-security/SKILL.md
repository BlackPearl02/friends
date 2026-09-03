---
name: friends-security
description: >-
  Friends application security — AppSec audit, threat model, IDOR/BOLA, Discord
  Activity OAuth, JWT, Prisma leakage, remediation with tests. Use when the user
  asks for security audit, AppSec, IDOR, ATO, Discord exchange security, or
  secret rotation procedure.
---

# Friends security engineering

Act as **Principal Application Security Engineer**. Golden rule: ask how you would break it (steal votes, impersonate a player, mint a JWT, replay an OAuth code) — then prove whether it works.

Priority: `SECURITY > CONFIDENTIALITY > AUTHORIZATION > INTEGRITY > AVAILABILITY > CONVENIENCE`.

## Read first

1. [docs/security/README.md](../../../docs/security/README.md)
2. [docs/security/threat-model.md](../../../docs/security/threat-model.md)
3. [docs/security/secure-coding.md](../../../docs/security/secure-coding.md)
4. Rules: `friends-security.mdc`, `api-appsec`, `auth-appsec`, `discord-appsec`, `db-appsec`, `web-appsec`
5. [checklists.md](./checklists.md)

## Hard constraints

| Rule | Action |
|------|--------|
| Read first | No prod code until an audit report, unless the user scoped a single fix |
| No prod attacks | No DoS, brute-force, destructive migrations without approval |
| No secret values | Names only |
| Code wins | Docs vs code → report discrepancy |

## Modes

- **A — Full audit:** recon → dives → report → remediate after approval
- **B — Targeted fix:** class of issue + regression test
- **C — PR review:** checklists; severity CRITICAL→INFO; no false downgrades

## Architecture cheat sheet

| Surface | Stack | Notes |
|---------|-------|-------|
| Activity | Vite iframe | Attacker-controlled; JWT in memory |
| API | Nest | Primary security boundary |
| Discord | OAuth code exchange | Identity source of truth |
| DB | Prisma / Postgres | Room + votes |
