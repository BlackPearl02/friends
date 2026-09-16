import type { DiscordSDK } from "@discord/embedded-app-sdk";
import type { PublicRoom } from "@friends/types";
import { t } from "./i18n";

/** Soft party ceiling shown in Rich Presence (matches product sweet spot). */
export const PRESENCE_PARTY_MAX = 8;

/**
 * Developer Portal → Rich Presence → Art Assets keys (lowercase as Discord stores them).
 * Current uploads: embedded_background, embedded_cover, squimbo-logo.
 */
export const PRESENCE_ASSET_KEYS = {
  large: "embedded_cover",
  small: "squimbo-logo",
} as const;

export type PresencePhase = "waiting" | "lobby" | "voting" | "reveal" | "finished";

export type RichPresenceActivity = {
  type: 0;
  details: string;
  state: string;
  timestamps: { start: number };
  assets: {
    large_image: string;
    large_text: string;
    small_image: string;
    small_text: string;
  };
  party: {
    id: string;
    size: [number, number];
  };
  instance: true;
};

export function resolvePresencePhase(
  shellPhase: "ready" | "waiting-in-progress",
  room: PublicRoom | null,
): PresencePhase | null {
  if (shellPhase === "waiting-in-progress") return "waiting";
  if (!room) return null;
  if (room.status === "lobby") return "lobby";
  if (room.status === "finished") return "finished";
  if (room.status === "playing" && room.round) {
    return room.round.status === "voting" ? "voting" : "reveal";
  }
  return null;
}

export function presenceRoundNumber(room: PublicRoom | null): number | undefined {
  if (!room?.round) return undefined;
  return room.round.index + 1;
}

export function buildRichPresenceActivity(input: {
  phase: PresencePhase;
  playerCount: number;
  partyId: string;
  startTimestampSec: number;
  roundNumber?: number;
}): RichPresenceActivity {
  const { phase, playerCount, partyId, startTimestampSec, roundNumber } = input;
  const count = Math.max(1, playerCount);
  const partyMax = Math.max(PRESENCE_PARTY_MAX, count);
  const round = roundNumber ?? 1;

  let details: string;
  let state: string;
  let smallText: string;

  switch (phase) {
    case "waiting":
      details = t("presence.waitingDetails");
      state = t("presence.waitingState");
      smallText = t("presence.waitingSmall");
      break;
    case "lobby":
      details = t("presence.lobbyDetails");
      state = t("presence.lobbyState", { count });
      smallText = t("presence.lobbySmall");
      break;
    case "voting":
      details = t("presence.votingDetails");
      state = t("presence.votingState", { round });
      smallText = t("presence.votingSmall");
      break;
    case "reveal":
      details = t("presence.revealDetails");
      state = t("presence.revealState", { round });
      smallText = t("presence.revealSmall");
      break;
    case "finished":
      details = t("presence.finishedDetails");
      state = t("presence.finishedState");
      smallText = t("presence.finishedSmall");
      break;
  }

  return {
    type: 0,
    details,
    state,
    timestamps: { start: startTimestampSec },
    assets: {
      large_image: PRESENCE_ASSET_KEYS.large,
      large_text: t("presence.largeText"),
      small_image: PRESENCE_ASSET_KEYS.small,
      small_text: smallText,
    },
    party: {
      id: partyId,
      size: [count, partyMax],
    },
    instance: true,
  };
}

/** Stable fingerprint so poll ticks do not spam SET_ACTIVITY. */
export function presenceFingerprint(activity: RichPresenceActivity): string {
  return [
    activity.details,
    activity.state,
    activity.timestamps.start,
    activity.assets.small_text,
    activity.party.id,
    activity.party.size[0],
    activity.party.size[1],
  ].join("|");
}

export type PresenceSdk = Pick<DiscordSDK, "commands">;

/**
 * Push Rich Presence when the fingerprint changes. Failures are ignored —
 * presence must never block gameplay.
 */
export async function syncDiscordPresence(
  sdk: PresenceSdk,
  activity: RichPresenceActivity,
  lastFingerprint: { current: string | null },
): Promise<void> {
  const next = presenceFingerprint(activity);
  if (lastFingerprint.current === next) return;
  try {
    await sdk.commands.setActivity({ activity });
  } catch {
    // Missing scope / RPC flake — presence is best-effort and must not block play.
  } finally {
    // Record attempt so room poll ticks do not spam SET_ACTIVITY every 750ms.
    lastFingerprint.current = next;
  }
}
