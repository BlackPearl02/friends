/**
 * Register / update Squimbo Discord Activity launch commands.
 *
 * What it does:
 * 1. Renames the Activity Entry Point (App Launcher) to `/squimbo`
 *    with DISCORD_LAUNCH_ACTIVITY — Discord opens the Activity itself.
 * 2. Ensures a chat slash command `/play` exists (handled by the API
 *    Interactions Endpoint → LAUNCH_ACTIVITY).
 *
 * Prerequisites:
 * - Activities enabled on the Discord application
 * - Bot token (Developer Portal → Bot → Reset Token)
 * - API Interactions Endpoint URL set to:
 *     https://<API_PUBLIC_URL>/discord/interactions
 *   (required for `/play`; Entry Point works without it when handler=2)
 *
 * Usage (repo root):
 *   DISCORD_BOT_TOKEN=… DISCORD_CLIENT_ID=… node scripts/register-discord-activity-commands.mjs
 *
 * Loads DISCORD_BOT_TOKEN / DISCORD_CLIENT_ID from .env.production or
 * .env.development when present (does not override existing env).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const API = "https://discord.com/api/v10";

/** ApplicationCommandType */
const CHAT_INPUT = 1;
const PRIMARY_ENTRY_POINT = 4;

/** EntryPointCommandHandlerType */
const DISCORD_LAUNCH_ACTIVITY = 2;

/** ApplicationIntegrationType: Guild Install, User Install */
const INTEGRATION_GUILD = 0;
const INTEGRATION_USER = 1;

/** InteractionContextType: Guild, Bot DM, Private Channel */
const CTX_GUILD = 0;
const CTX_BOT_DM = 1;
const CTX_PRIVATE = 2;

function loadEnvFile(name) {
  const path = resolve(ROOT, name);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env.production");
loadEnvFile(".env.development");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.VITE_DISCORD_CLIENT_ID;

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "SquimboCommands (github.com/squimbo; register-commands)",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || text || res.statusText;
    const errors = data?.errors ? ` ${JSON.stringify(data.errors)}` : "";
    throw new Error(`${method} ${path} → ${res.status}: ${msg}${errors}`);
  }
  await new Promise((r) => setTimeout(r, 350));
  return data;
}

const sharedMeta = {
  integration_types: [INTEGRATION_GUILD, INTEGRATION_USER],
  contexts: [CTX_GUILD, CTX_BOT_DM, CTX_PRIVATE],
};

const entryPointBody = {
  name: "squimbo",
  type: PRIMARY_ENTRY_POINT,
  handler: DISCORD_LAUNCH_ACTIVITY,
  description: "Launch Squimbo",
  name_localizations: { pl: "squimbo" },
  description_localizations: {
    pl: "Uruchom Squimbo",
  },
  ...sharedMeta,
};

const playBody = {
  name: "play",
  type: CHAT_INPUT,
  description: "Launch Squimbo in this channel",
  name_localizations: { pl: "graj" },
  description_localizations: {
    pl: "Uruchom Squimbo na tym kanale",
  },
  ...sharedMeta,
};

async function main() {
  if (!TOKEN) {
    console.error("Set DISCORD_BOT_TOKEN (Bot token from Developer Portal).");
    process.exit(1);
  }
  if (!CLIENT_ID) {
    console.error("Set DISCORD_CLIENT_ID (Application ID).");
    process.exit(1);
  }

  console.log(`Registering commands for application ${CLIENT_ID}…`);
  const existing = await api("GET", `/applications/${CLIENT_ID}/commands`);
  console.log(`  existing commands: ${existing.length}`);

  const entry = existing.find((c) => c.type === PRIMARY_ENTRY_POINT);
  if (entry) {
    const updated = await api(
      "PATCH",
      `/applications/${CLIENT_ID}/commands/${entry.id}`,
      entryPointBody,
    );
    console.log(`  entry point updated: /${updated.name} (id ${updated.id})`);
  } else {
    const created = await api(
      "POST",
      `/applications/${CLIENT_ID}/commands`,
      entryPointBody,
    );
    console.log(`  entry point created: /${created.name} (id ${created.id})`);
  }

  const play = existing.find((c) => c.type === CHAT_INPUT && c.name === "play");
  if (play) {
    const updated = await api(
      "PATCH",
      `/applications/${CLIENT_ID}/commands/${play.id}`,
      playBody,
    );
    console.log(`  /play updated (id ${updated.id})`);
  } else {
    const created = await api("POST", `/applications/${CLIENT_ID}/commands`, playBody);
    console.log(`  /play created (id ${created.id})`);
  }

  console.log("");
  console.log("Next:");
  console.log("  1. Set DISCORD_PUBLIC_KEY on the API (Developer Portal → General Information).");
  console.log("  2. Interactions Endpoint URL → https://<API>/discord/interactions");
  console.log("  3. Invite with applications.commands (+ bot if needed):");
  console.log(
    `     https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=0`,
  );
  console.log("  Global commands can take up to ~1 hour to propagate (often minutes).");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
