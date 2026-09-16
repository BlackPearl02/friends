# Squimbo Discord — admin & support server

| | |
|---|---|
| **Guild ID** | `1549781444300251270` |
| **Name** | Squimbo |
| **Public invite** | `https://discord.gg/PrQkDcxEqk` (used by marketing Support page) |
| **Env override** | `NEXT_PUBLIC_SUPPORT_DISCORD_URL` |

This is the **community + support** guild linked from [squimbo.app](https://squimbo.app) Support. Private **Staff** channels are for ops only.

## Target layout

| Category | Channels | Who can post |
|---|---|---|
| **Community Rules** | Official Rules / Guidelines channel (Discord Community setting — **not** a duplicate `#rules`) | Staff / rules screening |
| **Info** | `#announcements`, `#status` | Staff only (everyone can read) |
| **Support** | `#help`, `#bugs`, `#ideas` | Everyone |
| **Community** | `#chat` (+ existing `#general` if kept) | Everyone |
| **Staff** | `#staff`, `#triage`, `#ops` | Admin + Support only |

**Roles**

| Role | Purpose |
|---|---|
| **Admin** | Owners / full ops |
| **Support** | Answer tickets, moderate, post announcements |
| **@everyone** | Members |

## Automated setup

Requires a **Bot** on a Discord application (can be the Squimbo Activity app or a throwaway ops bot) invited with **Administrator**.

```bash
# From repo root — token is a secret; do not commit it.
DISCORD_BOT_TOKEN="…" node scripts/setup-discord-support-server.mjs
```

Optional: `DISCORD_SUPPORT_GUILD_ID` (defaults to `1549781444300251270`).

The script is **idempotent** (skips existing names) and **never deletes** channels.

If channels exist but Staff is invisible / overwrites lack Admin & Support, the bot role was likely **below** those roles. Fix with:

```bash
node scripts/repair-discord-support-server.mjs
```

(loads `DISCORD_BOT_TOKEN` from `.env.production` or the environment)

Invite URL template:

`https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot`

## Manual checklist (after script or instead)

1. Roles: Admin above Support above @everyone; assign Admin to yourself.
2. Use the **existing** Community Rules channel (Safety Setup / Rules Screening) — do not keep a second `#rules` under Info; delete the leftover if the setup script created one.
3. Verification level: at least **Low** (verified email) — currently Low on this guild.
4. Invite settings: destination `#help`; **never** Staff; permanent invite already in web Support.
5. Developer Portal → Application → Support / contact URL → `https://squimbo.app/en/support` (or current web host).
6. Kick the setup bot if you do not need it day-to-day.

## Suggested rules copy (English)

Paste into the Community Rules channel. Keep it short; Polish can mirror on the same message or a follow-up.

1. Be respectful — no harassment, hate, or NSFW.
2. Support stays in `#help` / `#bugs` — include device + what you tried.
3. No spam, ads, or invite farming.
4. Squimbo is a Discord Activity — we cannot reset Discord accounts or recover Discord passwords.
5. Staff decisions on moderation are final; appeal in `#help` calmly.

## Security

- Do not paste JWTs, Discord OAuth codes, or production secrets into any channel (including Staff).
- Prefer links to status / docs over dumping env values.
- Public invite must not land in Staff.
