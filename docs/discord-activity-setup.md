# Discord Activity setup (Friends)

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

## Env

Root `.env.development`:

- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
- `VITE_DISCORD_CLIENT_ID` (same id; public)
- `JWT_SECRET`
- Optional `DISCORD_ACTIVITY_REDIRECT_URI` to pin one redirect

Inside the Discord iframe, `VITE_FRIENDS_API_URL` should stay **empty** so the client calls `/api/...` through Discord’s mapping. Set it only for the browser mock (`DiscordSDKMock`).

## Identity rule

Token exchange happens **server-side**. Never trust `userId` / `guildId` / `instanceId` from the Activity client as authorization. The JWT subject is the Friends `User.id` provisioned after Discord `/users/@me`.
