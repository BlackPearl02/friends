/**
 * Discord `/api` URL mapping may keep or strip the prefix (same ambiguity as `/party`).
 * Rewrite kept `/api/...` onto Nest's unprefixed routes.
 */
export function stripDiscordApiPrefix(url: string): string {
  if (url === "/api") return "/";
  if (url.startsWith("/api?")) return `/${url.slice(4)}`;
  if (url.startsWith("/api/")) {
    const rest = url.slice(4);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return url;
}
