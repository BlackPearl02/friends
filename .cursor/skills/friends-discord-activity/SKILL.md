---
name: friends-discord-activity
description: >-
  Discord Embedded App for Friends — SDK ready/authorize/authenticate, URL
  mappings, HTTPS tunnels, token exchange, participants. Use when working on
  apps/activity, Activity OAuth, discordsays.com, or local Activity dev.
---

# Friends Discord Activity

## Read first

1. [docs/discord-activity-setup.md](../../../docs/discord-activity-setup.md)
2. [apps/activity/README.md](../../../apps/activity/README.md)
3. Rule `discord-appsec.mdc`

## Bootstrap order

1. `DiscordSDK(clientId)` → `ready()`
2. `authorize` (`identify`, `guilds`, `rpc.activities.write`) → `code`
3. `POST /api/discord/activity/exchange` `{ code }` → Friends JWT + `discordAccessToken`
4. `sdk.commands.authenticate({ access_token })`
5. Join room with **server** `instanceId` from SDK (`discordSdk.instanceId`) — send it as a claim to join, API still binds the authenticated user

## Local

Discord rejects `localhost`. Tunnel `:3003` and `:3000`. Map `/` and `/api`. Inside the iframe, API base URL is empty (relative `/api`).

## MUST NOT

- Trust client `user.id` for scores or votes
- Call Discord token endpoint from the iframe
