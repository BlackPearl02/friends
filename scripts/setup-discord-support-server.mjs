/**
 * One-shot Discord guild setup for Squimbo admin + support.
 *
 * Prerequisites:
 * 1. Developer Portal → Application → Bot → Reset Token → copy token
 * 2. Enable Privileged intents only if needed (none required for this script)
 * 3. Invite bot with Administrator (or Manage Roles + Manage Channels):
 *    https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot
 * 4. Run from repo root:
 *    DISCORD_BOT_TOKEN=… node scripts/setup-discord-support-server.mjs
 *
 * Idempotent: skips roles/channels that already exist by name.
 * Does not delete anything.
 *
 * If roles exist but channel overwrites lack Admin/Support, the bot role was
 * probably below those roles — run scripts/repair-discord-support-server.mjs.
 */

const GUILD_ID = process.env.DISCORD_SUPPORT_GUILD_ID || "1549781444300251270";
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const API = "https://discord.com/api/v10";

/** @see https://discord.com/developers/docs/topics/permissions */
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

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "SquimboSetup (github.com/squimbo; setup-script)",
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
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  // Discord rate-limit courtesy
  await new Promise((r) => setTimeout(r, 350));
  return data;
}

async function ensureRole(existing, def) {
  const found = existing.find((r) => r.name === def.name);
  if (found) {
    console.log(`  role ok: ${def.name}`);
    return found;
  }
  const created = await api("POST", `/guilds/${GUILD_ID}/roles`, {
    name: def.name,
    color: def.color,
    hoist: def.hoist ?? false,
    mentionable: def.mentionable ?? false,
    permissions: def.permissions,
  });
  console.log(`  role created: ${def.name}`);
  return created;
}

async function ensureCategory(channels, name, position) {
  const found = channels.find((c) => c.type === 4 && c.name === name);
  if (found) {
    console.log(`  category ok: ${name}`);
    return found;
  }
  const created = await api("POST", `/guilds/${GUILD_ID}/channels`, {
    name,
    type: 4,
    position,
  });
  console.log(`  category created: ${name}`);
  return created;
}

async function ensureChannel(channels, def) {
  const found = channels.find(
    (c) => c.parent_id === def.parent_id && c.name === def.name && c.type === def.type,
  );
  if (found) {
    console.log(`  channel ok: #${def.name}`);
    return found;
  }
  const created = await api("POST", `/guilds/${GUILD_ID}/channels`, def);
  console.log(`  channel created: #${def.name}`);
  return created;
}

function overwrite(id, type, allow, deny = "0") {
  return { id, type, allow, deny };
}

async function main() {
  if (!TOKEN) {
    console.error("Set DISCORD_BOT_TOKEN (Bot token from Developer Portal).");
    process.exit(1);
  }

  const me = await api("GET", "/users/@me");
  console.log(`Bot: ${me.username} (${me.id})`);
  console.log(`Guild: ${GUILD_ID}\n`);

  const roles = await api("GET", `/guilds/${GUILD_ID}/roles`);
  const everyone = roles.find((r) => r.id === GUILD_ID);
  if (!everyone) throw new Error("@everyone role not found");

  console.log("Roles");
  const admin = await ensureRole(roles, {
    name: "Admin",
    color: 0xe74c3c,
    hoist: true,
    mentionable: false,
    permissions: perm(
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
    ),
  });
  const support = await ensureRole(roles, {
    name: "Support",
    color: 0x3498db,
    hoist: true,
    mentionable: true,
    permissions: STAFF_MOD,
  });

  let channels = await api("GET", `/guilds/${GUILD_ID}/channels`);

  console.log("\nCategories + channels");
  const catInfo = await ensureCategory(channels, "Info", 0);
  const catSupport = await ensureCategory(channels, "Support", 1);
  const catCommunity = await ensureCategory(channels, "Community", 2);
  const catStaff = await ensureCategory(channels, "Staff", 3);

  channels = await api("GET", `/guilds/${GUILD_ID}/channels`);

  const staffOnly = [
    overwrite(everyone.id, 0, "0", perm(Perm.VIEW_CHANNEL)),
    overwrite(admin.id, 0, EVERYONE_CHAT, "0"),
    overwrite(support.id, 0, EVERYONE_CHAT, "0"),
  ];

  const announceOnly = [
    overwrite(
      everyone.id,
      0,
      EVERYONE_READ,
      perm(Perm.SEND_MESSAGES),
    ),
    overwrite(admin.id, 0, EVERYONE_CHAT, "0"),
    overwrite(support.id, 0, EVERYONE_CHAT, "0"),
  ];

  const publicChat = [
    overwrite(everyone.id, 0, EVERYONE_CHAT, "0"),
  ];

  // Community guilds already have an official Rules / Guidelines channel
  // (guild.rules_channel_id). Do not create a duplicate #rules.
  const guild = await api("GET", `/guilds/${GUILD_ID}`);
  if (guild.rules_channel_id) {
    const rulesCh = channels.find((c) => c.id === guild.rules_channel_id);
    console.log(
      `  rules: using Community channel #${rulesCh?.name || guild.rules_channel_id} (skip #rules)`,
    );
  } else {
    console.log(
      "  rules: no guild.rules_channel_id — set it in Server Settings → Safety → Rules Screening",
    );
  }

  await ensureChannel(channels, {
    name: "announcements",
    type: 5, // announcement (NEWS feature enabled on this guild)
    parent_id: catInfo.id,
    topic: "Product updates and important notices from the Squimbo team.",
    permission_overwrites: announceOnly,
  });
  await ensureChannel(channels, {
    name: "status",
    type: 0,
    parent_id: catInfo.id,
    topic: "Incidents and known issues. Staff posts only.",
    permission_overwrites: announceOnly,
  });

  await ensureChannel(channels, {
    name: "help",
    type: 0,
    parent_id: catSupport.id,
    topic: "Need help playing Squimbo? Describe what you see + device (desktop/mobile).",
    permission_overwrites: publicChat,
  });
  await ensureChannel(channels, {
    name: "bugs",
    type: 0,
    parent_id: catSupport.id,
    topic: "Bug reports: steps to reproduce, expected vs actual, screenshot if possible.",
    permission_overwrites: publicChat,
  });
  await ensureChannel(channels, {
    name: "ideas",
    type: 0,
    parent_id: catSupport.id,
    topic: "Feature ideas and feedback. No guarantees — we read everything.",
    permission_overwrites: publicChat,
  });

  await ensureChannel(channels, {
    name: "chat",
    type: 0,
    parent_id: catCommunity.id,
    topic: "Off-topic / party vibes. Keep it friendly.",
    permission_overwrites: publicChat,
  });

  // Keep existing #general if present; do not rename.
  const general = channels.find((c) => c.name === "general" && c.type === 0);
  if (general && !general.parent_id) {
    await api("PATCH", `/channels/${general.id}`, {
      parent_id: catCommunity.id,
      topic: "General hangout (legacy default channel).",
    });
    console.log("  moved #general → Community");
  }

  await ensureChannel(channels, {
    name: "staff",
    type: 0,
    parent_id: catStaff.id,
    topic: "Private staff chat.",
    permission_overwrites: staffOnly,
  });
  await ensureChannel(channels, {
    name: "triage",
    type: 0,
    parent_id: catStaff.id,
    topic: "Incoming support / bugs to claim and resolve.",
    permission_overwrites: staffOnly,
  });
  await ensureChannel(channels, {
    name: "ops",
    type: 0,
    parent_id: catStaff.id,
    topic: "Deploy notes, Discord portal, Vercel, incidents.",
    permission_overwrites: staffOnly,
  });

  console.log(`
Done.

Manual follow-ups in Discord:
1. Server Settings → Roles → drag Admin above Support above @everyone
2. Assign yourself Admin; assign Support to helpers
3. Keep Community Rules Screening on the official rules channel (do not add a second #rules)
4. If a leftover #rules text channel exists under Info, delete it in Discord
5. Edit invite ${process.env.NEXT_PUBLIC_SUPPORT_DISCORD_URL || "https://discord.gg/PrQkDcxEqk"}
   → point at #help (never Staff)
6. Optional: remove Bot from the server after setup (or keep for future ops)
`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
