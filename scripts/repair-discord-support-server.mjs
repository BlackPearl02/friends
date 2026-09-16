/**
 * Repair Squimbo support guild: role order + channel overwrites.
 * Loads DISCORD_BOT_TOKEN from .env.production (do not commit).
 *
 * Run: node scripts/repair-discord-support-server.mjs
 */
import { readFileSync } from "fs";

const GUILD_ID = process.env.DISCORD_SUPPORT_GUILD_ID || "1549781444300251270";
const API = "https://discord.com/api/v10";

const env = Object.fromEntries(
  readFileSync(".env.production", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, i).trim(), v];
    }),
);

const TOKEN = process.env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error("Missing DISCORD_BOT_TOKEN");
  process.exit(1);
}

const Perm = {
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  ADD_REACTIONS: 1n << 6n,
  MANAGE_CHANNELS: 1n << 4n,
  MODERATE_MEMBERS: 1n << 40n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  MANAGE_ROLES: 1n << 28n,
};

function perm(...flags) {
  return flags.reduce((a, b) => a | b, 0n).toString();
}

const EVERYONE_READ = perm(
  Perm.VIEW_CHANNEL,
  Perm.READ_MESSAGE_HISTORY,
  Perm.ADD_REACTIONS,
);
const EVERYONE_CHAT = perm(
  Perm.VIEW_CHANNEL,
  Perm.SEND_MESSAGES,
  Perm.EMBED_LINKS,
  Perm.ATTACH_FILES,
  Perm.READ_MESSAGE_HISTORY,
  Perm.ADD_REACTIONS,
);
const STAFF_MOD = perm(
  Perm.VIEW_CHANNEL,
  Perm.SEND_MESSAGES,
  Perm.MANAGE_MESSAGES,
  Perm.EMBED_LINKS,
  Perm.ATTACH_FILES,
  Perm.READ_MESSAGE_HISTORY,
  Perm.ADD_REACTIONS,
  Perm.MODERATE_MEMBERS,
  Perm.KICK_MEMBERS,
  Perm.MENTION_EVERYONE,
);
const ADMIN_PERMS = perm(
  Perm.VIEW_CHANNEL,
  Perm.SEND_MESSAGES,
  Perm.MANAGE_MESSAGES,
  Perm.MANAGE_CHANNELS,
  Perm.MANAGE_ROLES,
  Perm.KICK_MEMBERS,
  Perm.BAN_MEMBERS,
  Perm.MODERATE_MEMBERS,
  Perm.MENTION_EVERYONE,
  Perm.EMBED_LINKS,
  Perm.ATTACH_FILES,
  Perm.READ_MESSAGE_HISTORY,
  Perm.ADD_REACTIONS,
);

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "SquimboSetup (repair)",
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
    throw new Error(`${method} ${path} → ${res.status}: ${data?.message || text}`);
  }
  await new Promise((r) => setTimeout(r, 400));
  return data;
}

function overwrite(id, type, allow, deny = "0") {
  return { id, type, allow, deny };
}

async function ensureRole(roles, def) {
  let found = roles.find((r) => r.name === def.name);
  if (!found) {
    found = await api("POST", `/guilds/${GUILD_ID}/roles`, {
      name: def.name,
      color: def.color,
      hoist: def.hoist ?? false,
      mentionable: def.mentionable ?? false,
      permissions: def.permissions,
    });
    console.log(`created role ${def.name}`);
    roles.push(found);
  } else {
    await api("PATCH", `/guilds/${GUILD_ID}/roles/${found.id}`, {
      color: def.color,
      hoist: def.hoist ?? false,
      mentionable: def.mentionable ?? false,
      permissions: def.permissions,
    });
    console.log(`updated role ${def.name}`);
  }
  return roles.find((r) => r.name === def.name);
}

async function main() {
  const me = await api("GET", "/users/@me");
  console.log(`Bot: ${me.username} (${me.id})`);

  let roles = await api("GET", `/guilds/${GUILD_ID}/roles`);
  const everyone = roles.find((r) => r.id === GUILD_ID);
  const botRole = roles.find((r) => r.tags?.bot_id === me.id);
  if (!botRole) {
    throw new Error("Bot role not found in guild — re-invite the bot");
  }
  console.log(`Bot role: ${botRole.name} pos=${botRole.position}`);

  const admin = await ensureRole(roles, {
    name: "Admin",
    color: 0xe74c3c,
    hoist: true,
    mentionable: false,
    permissions: ADMIN_PERMS,
  });
  roles = await api("GET", `/guilds/${GUILD_ID}/roles`);
  const support = await ensureRole(roles, {
    name: "Support",
    color: 0x3498db,
    hoist: true,
    mentionable: true,
    permissions: STAFF_MOD,
  });

  // Hierarchy: bot must sit ABOVE Admin/Support or overwrites for those roles fail.
  roles = await api("GET", `/guilds/${GUILD_ID}/roles`);
  const freshBot = roles.find((r) => r.tags?.bot_id === me.id);
  const freshAdmin = roles.find((r) => r.id === admin.id);
  const freshSupport = roles.find((r) => r.id === support.id);
  if (!freshBot || !freshAdmin || !freshSupport) {
    throw new Error("Missing bot/Admin/Support roles after update");
  }

  // Positions: higher number = higher in hierarchy. @everyone is always 0.
  // Place bot just under the top managed slot by using relative positions.
  const maxPos = Math.max(...roles.map((r) => r.position), 1);
  const positions = [
    { id: freshBot.id, position: maxPos + 2 },
    { id: freshAdmin.id, position: maxPos + 1 },
    { id: freshSupport.id, position: maxPos },
  ];
  await api("PATCH", `/guilds/${GUILD_ID}/roles`, positions);
  console.log("role order: Bot > Admin > Support");

  const staffOnly = [
    overwrite(everyone.id, 0, "0", perm(Perm.VIEW_CHANNEL)),
    overwrite(admin.id, 0, EVERYONE_CHAT, "0"),
    overwrite(support.id, 0, EVERYONE_CHAT, "0"),
  ];
  const announceOnly = [
    overwrite(everyone.id, 0, EVERYONE_READ, perm(Perm.SEND_MESSAGES)),
    overwrite(admin.id, 0, EVERYONE_CHAT, "0"),
    overwrite(support.id, 0, EVERYONE_CHAT, "0"),
  ];
  const publicChat = [overwrite(everyone.id, 0, EVERYONE_CHAT, "0")];

  const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
  const byName = (name, type) =>
    channels.filter((c) => c.name === name && (type === undefined || c.type === type));

  const patch = async (ch, overwrites, label) => {
    await api("PATCH", `/channels/${ch.id}`, {
      permission_overwrites: overwrites,
    });
    console.log(`overwrites → #${ch.name} (${label})`);
  };

  for (const ch of byName("announcements", 5)) await patch(ch, announceOnly, "announce");
  for (const ch of byName("status", 0)) await patch(ch, announceOnly, "announce");
  // Official Community #rules — read-only for members, staff can post
  for (const ch of byName("rules", 0)) await patch(ch, announceOnly, "rules");

  for (const name of ["help", "bugs", "ideas", "chat", "general"]) {
    for (const ch of byName(name, 0)) await patch(ch, publicChat, "public");
  }

  for (const name of ["staff", "triage", "ops", "moderator-only"]) {
    for (const ch of byName(name, 0)) await patch(ch, staffOnly, "staff");
  }

  console.log(`
Done. Assign yourself the Admin role in Server Settings → Members.
Verify Staff channels are visible only with Admin/Support.
`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
