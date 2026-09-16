/** Discord InteractionType */
const PING = 1;
const APPLICATION_COMMAND = 2;

/** Discord InteractionCallbackType */
const PONG = 1;
const CHANNEL_MESSAGE = 4;
const LAUNCH_ACTIVITY = 12;

/** Ephemeral flag */
const EPHEMERAL = 1 << 6;

/** Slash / entry-point names that should open Squimbo. */
const LAUNCH_COMMAND_NAMES = new Set(["squimbo", "play", "launch", "graj"]);

export type DiscordInteractionBody = {
  type: number;
  data?: { name?: string; type?: number };
};

export type DiscordInteractionResponse = {
  type: number;
  data?: { content: string; flags?: number };
};

/**
 * Map a verified Discord interaction to a callback payload.
 * Launch commands → LAUNCH_ACTIVITY (12); unknown commands → ephemeral hint.
 */
export function handleDiscordInteraction(
  body: DiscordInteractionBody,
): DiscordInteractionResponse {
  if (body.type === PING) {
    return { type: PONG };
  }

  if (body.type === APPLICATION_COMMAND) {
    const name = body.data?.name?.toLowerCase() ?? "";
    if (LAUNCH_COMMAND_NAMES.has(name)) {
      return { type: LAUNCH_ACTIVITY };
    }
    return {
      type: CHANNEL_MESSAGE,
      data: {
        content: "Unknown command. Try `/squimbo` or `/play` to launch Squimbo.",
        flags: EPHEMERAL,
      },
    };
  }

  return {
    type: CHANNEL_MESSAGE,
    data: {
      content: "This interaction is not supported.",
      flags: EPHEMERAL,
    },
  };
}
