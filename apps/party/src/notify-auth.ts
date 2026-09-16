/**
 * Shared secret gate for Nest → PartyKit HTTP notify.
 * Clients connect over WebSocket without this secret.
 */
export function isAuthorizedNotify(
  authHeader: string | null,
  expectedSecret: string | undefined,
): boolean {
  const secret = expectedSecret?.trim() ?? "";
  if (!secret) return false;
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 && token === secret;
}
