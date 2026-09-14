/** Pure lobby hint: Discord instance has people who have not joined Squimbo yet. */
export function lobbyWaitingForDiscordJoin(
  roomPlayerCount: number,
  discordParticipantCount: number | null,
): boolean {
  if (discordParticipantCount == null) return false;
  return discordParticipantCount > roomPlayerCount;
}
