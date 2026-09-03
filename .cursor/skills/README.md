# Friends Cursor skills

Project-specific agent skills. Cursor discovers this folder automatically.

## Skill vs rule

| Layer | Location | Use for |
|-------|----------|---------|
| **Rule** | [`.cursor/rules/`](../rules/) | Short mandatory constraints; target **&lt;60 lines** |
| **Skill** | `.cursor/skills/<name>/SKILL.md` | Multi-step workflows |
| **Docs** | `docs/` | Long reference |

## Skills

| Skill | When to use |
|-------|-------------|
| [friends-game-design](./friends-game-design/SKILL.md) | Rounds, categories, scoring, Kumple mapping |
| [friends-discord-activity](./friends-discord-activity/SKILL.md) | Embedded App SDK, tunnels, URL mappings, OAuth exchange |
| [friends-api-nest](./friends-api-nest/SKILL.md) | Nest endpoints, DTOs, JWT, room authz |
| [friends-prisma-db](./friends-prisma-db/SKILL.md) | Schema, migrations, seed |
| [friends-testing](./friends-testing/SKILL.md) | Vitest, integration, CI |
| [friends-security](./friends-security/SKILL.md) | AppSec audit, IDOR, Discord tokens |
| [friends-copywriting](./friends-copywriting/SKILL.md) | Activity UI voice, en+pl |
| [friends-git-staging](./friends-git-staging/SKILL.md) | Atomic conventional commits |

## Adding a skill

Follow an existing `SKILL.md`. Update this table. Link rules and docs — do not duplicate long docs inside the skill.
