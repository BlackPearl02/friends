import { DiscordSDK, Events } from "@discord/embedded-app-sdk";

export type DiscordParticipant = {
  id: string;
  username?: string | null;
  global_name?: string | null;
};

/** How many Discord users are connected to this Activity instance (not Squimbo room). */
export async function fetchDiscordParticipantCount(sdk: DiscordSDK): Promise<number> {
  const { participants } = await sdk.commands.getActivityInstanceConnectedParticipants();
  return participants.length;
}

export function subscribeDiscordParticipants(
  sdk: DiscordSDK,
  onCount: (count: number) => void,
): () => void {
  const handler = (payload: { participants: DiscordParticipant[] }) => {
    onCount(payload.participants.length);
  };

  void sdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handler);
  void fetchDiscordParticipantCount(sdk)
    .then(onCount)
    .catch(() => undefined);

  return () => {
    void sdk.unsubscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handler);
  };
}
