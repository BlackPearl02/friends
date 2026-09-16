# Discord Activity setup (Squimbo)

Product name in Discord: **Squimbo**. Monorepo packages: `@friends/*`.

Discord rejects bare `localhost` mappings. Local play needs a public HTTPS tunnel (cloudflared or ngrok) for both the Activity UI and the API.

## Developer Portal

1. Create (or reuse) a Discord application.
2. Enable **Activities**.
3. URL mappings (typical):
   - `/` → Activity tunnel (Vite `:3003`)
   - `/api` → API tunnel (Nest `:3000`)
4. OAuth2 → Redirects: include the shapes Nest tries when `DISCORD_ACTIVITY_REDIRECT_URI` is empty:
   - `https://127.0.0.1`
   - `https://<CLIENT_ID>.discordsays.com`
5. OAuth scopes used by the Activity: `identify`, `guilds`, `rpc.activities.write`.

## Application information URLs

After the marketing site is deployed (`apps/web`), set these in **Developer Portal → General Information** (and Support if separate):

| Field | Example |
|---|---|
| Website | `https://friends-web.vercel.app/en` |
| Privacy Policy | `https://friends-web.vercel.app/en/privacy` |
| Terms of Service | `https://friends-web.vercel.app/en/terms` |
| Support / contact | `https://friends-web.vercel.app/en/support` |

Community / support Discord guild setup: [discord-support-server.md](./discord-support-server.md) (`1549781444300251270`, invite `https://discord.gg/PrQkDcxEqk`).

Marketing site copy is English only (`/en/...`). See [deployment.md](./deployment.md).

## Launch (Activity Entry Point — no bot)

Discord requires **one** global [Entry Point](https://docs.discord.com/developers/interactions/application-commands#entry-point-commands) command or the Activity may not launch. That is **not** the same as adding a bot to player guilds.

| Keep | Skip |
|---|---|
| Entry Point `/squimbo` with handler `DISCORD_LAUNCH_ACTIVITY` (Discord opens the Activity) | Chat slash `/play` |
| Activity launcher / voice channel UI | Interactions Endpoint URL |
| Bot token only for ops scripts | Invite with `bot` scope on player servers |

Register / repair the Entry Point (HTTP only — Discord has no portal button for this):

```bash
# Needs DISCORD_BOT_TOKEN + DISCORD_CLIENT_ID (loads from .env.production / .env.development).
node scripts/register-discord-activity-entrypoint.mjs
```

Leave **Interactions Endpoint URL** empty in the Developer Portal. Do not register chat slash commands.

## Env

Root `.env.development`:

- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
- `VITE_DISCORD_CLIENT_ID` (same id; public)
- `JWT_SECRET`
- Optional `DISCORD_ACTIVITY_REDIRECT_URI` to pin one redirect
- Optional `DISCORD_BOT_TOKEN` only for ops scripts (Entry Point register, support-server setup)

Inside the Discord iframe, `VITE_FRIENDS_API_URL` should stay **empty** so the client calls `/api/...` through Discord’s mapping. Set it only for the browser mock (`DiscordSDKMock`).

## Identity rule

Token exchange happens **server-side**. Never trust `userId` / `guildId` / `instanceId` from the Activity client as authorization. The JWT subject is the Squimbo `User.id` (DB) provisioned after Discord `/users/@me`.
