/**
 * Ensure Squimbo has a global PRIMARY_ENTRY_POINT command.
 *
 * Discord Activities require exactly one Entry Point or the client warns
 * that the Activity may not be launchable. Handler DISCORD_LAUNCH_ACTIVITY (2)
 * means Discord opens the Activity itself — no Interactions Endpoint and no
 * bot invite in player guilds.
 *
 * Does NOT register chat slash commands (`/play`, etc.).
 *
 * Usage (repo root):
 *   node scripts/register-discord-activity-entrypoint.mjs
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

const PRIMARY_ENTRY_POINT = 4;
const DISCORD_LAUNCH_ACTIVITY = 2;
const INTEGRATION_GUILD = 0;
const INTEGRATION_USER = 1;
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
      "User-Agent": "SquimboCommands (github.com/squimbo; register-entrypoint)",
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

const entryPointBody = {
  name: "squimbo",
  type: PRIMARY_ENTRY_POINT,
  handler: DISCORD_LAUNCH_ACTIVITY,
  description: "Launch Squimbo",
  name_localizations: { pl: "squimbo" },
  description_localizations: {
    pl: "Uruchom Squimbo",
  },
  integration_types: [INTEGRATION_GUILD, INTEGRATION_USER],
  contexts: [CTX_GUILD, CTX_BOT_DM, CTX_PRIVATE],
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

  console.log(`Ensuring Entry Point for application ${CLIENT_ID}…`);
  const existing = await api("GET", `/applications/${CLIENT_ID}/commands`);
  const entry = existing.find((c) => c.type === PRIMARY_ENTRY_POINT);
  const chat = existing.filter((c) => c.type !== PRIMARY_ENTRY_POINT);

  if (entry) {
    const updated = await api(
      "PATCH",
      `/applications/${CLIENT_ID}/commands/${entry.id}`,
      entryPointBody,
    );
    console.log(`  entry point updated: /${updated.name} (id ${updated.id}, handler ${updated.handler})`);
  } else {
    const created = await api(
      "POST",
      `/applications/${CLIENT_ID}/commands`,
      entryPointBody,
    );
    console.log(`  entry point created: /${created.name} (id ${created.id}, handler ${created.handler})`);
  }

  if (chat.length) {
    console.log(`  note: ${chat.length} non–Entry Point command(s) still registered:`);
    for (const c of chat) {
      console.log(`    - /${c.name} (type ${c.type}, id ${c.id})`);
    }
  }

  console.log("");
  console.log("Entry Point with DISCORD_LAUNCH_ACTIVITY does not need:");
  console.log("  - Interactions Endpoint URL");
  console.log("  - bot invite in player guilds");
  console.log("Propagation can take up to ~1 hour (often minutes).");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
