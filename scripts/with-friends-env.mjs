import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.env.NODE_ENV ?? "development";

// Priority (last wins): .env → .env.<mode> → .env.local
const files = [
  join(root, ".env"),
  join(root, `.env.${mode}`),
  join(root, ".env.local"),
].filter((p) => existsSync(p));

for (const p of files) {
  config({ path: p, override: true });
}

const args = process.argv.slice(2);
const sep = args.indexOf("--");
const cmd = sep >= 0 ? args.slice(sep + 1) : args;
if (cmd.length === 0) {
  console.error("Usage: node scripts/with-friends-env.mjs -- <command> [args…]");
  process.exit(1);
}

const [exe, ...rest] = cmd;
const child = spawn(exe, rest, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (e) => {
  console.error(e);
  process.exit(1);
});
