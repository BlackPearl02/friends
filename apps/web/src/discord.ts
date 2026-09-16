export function discordPlayUrl(clientId: string | undefined): string | null {
  if (!clientId) return null;
  return `https://discord.com/discovery/applications/${clientId}`;
}
