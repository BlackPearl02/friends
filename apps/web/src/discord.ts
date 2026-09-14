export function discordPlayUrl(clientId: string | undefined): string | null {
  if (!clientId) return null;
  return `https://discord.com/application-directory/${clientId}`;
}
