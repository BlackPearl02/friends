import { describe, expect, it, vi } from "vitest";
import {
  buildRichPresenceActivity,
  presenceFingerprint,
  presenceRoundNumber,
  PRESENCE_ASSET_KEYS,
  PRESENCE_PARTY_MAX,
  resolvePresencePhase,
  syncDiscordPresence,
} from "./discordPresence";
import { previewFinished, previewReveal, previewRound, previewRoom } from "./previewData";

describe("resolvePresencePhase", () => {
  it("maps waiting shell to waiting presence", () => {
    expect(resolvePresencePhase("waiting-in-progress", null)).toBe("waiting");
  });

  it("maps lobby / voting / reveal / finished rooms", () => {
    expect(resolvePresencePhase("ready", previewRoom)).toBe("lobby");
    expect(resolvePresencePhase("ready", previewRound)).toBe("voting");
    expect(resolvePresencePhase("ready", previewReveal)).toBe("reveal");
    expect(resolvePresencePhase("ready", previewFinished)).toBe("finished");
  });
});

describe("presenceRoundNumber", () => {
  it("uses 1-based round index", () => {
    expect(presenceRoundNumber(previewRound)).toBe(1);
    expect(presenceRoundNumber(previewReveal)).toBe(8);
    expect(presenceRoundNumber(previewRoom)).toBeUndefined();
  });
});

describe("buildRichPresenceActivity", () => {
  it("builds lobby presence with assets, timer, and party size", () => {
    const activity = buildRichPresenceActivity({
      phase: "lobby",
      playerCount: 3,
      partyId: "instance-1",
      startTimestampSec: 1_700_000_000,
    });

    expect(activity.type).toBe(0);
    expect(activity.details).toBe("In the lobby");
    expect(activity.state).toBe("3 in the room");
    expect(activity.timestamps.start).toBe(1_700_000_000);
    expect(activity.assets.large_image).toBe(PRESENCE_ASSET_KEYS.large);
    expect(activity.assets.small_image).toBe(PRESENCE_ASSET_KEYS.small);
    expect(activity.assets.small_text).toBe("Lobby");
    expect(activity.party).toEqual({ id: "instance-1", size: [3, PRESENCE_PARTY_MAX] });
    expect(activity.instance).toBe(true);
  });

  it("raises party max when the room is over the soft ceiling", () => {
    const activity = buildRichPresenceActivity({
      phase: "voting",
      playerCount: 10,
      partyId: "instance-1",
      startTimestampSec: 1_700_000_000,
      roundNumber: 2,
    });
    expect(activity.party.size).toEqual([10, 10]);
    expect(activity.state).toBe("Round 2");
    expect(activity.details).toBe("Most likely");
  });
});

describe("syncDiscordPresence", () => {
  it("skips setActivity when the fingerprint is unchanged", async () => {
    const activity = buildRichPresenceActivity({
      phase: "lobby",
      playerCount: 2,
      partyId: "p",
      startTimestampSec: 100,
    });
    const setActivity = vi.fn().mockResolvedValue({});
    const last = { current: presenceFingerprint(activity) };

    await syncDiscordPresence({ commands: { setActivity } } as never, activity, last);

    expect(setActivity).not.toHaveBeenCalled();
  });

  it("calls setActivity once when presence changes", async () => {
    const activity = buildRichPresenceActivity({
      phase: "finished",
      playerCount: 4,
      partyId: "p",
      startTimestampSec: 100,
    });
    const setActivity = vi.fn().mockResolvedValue({});
    const last = { current: null as string | null };

    await syncDiscordPresence({ commands: { setActivity } } as never, activity, last);

    expect(setActivity).toHaveBeenCalledTimes(1);
    expect(setActivity).toHaveBeenCalledWith({ activity });
    expect(last.current).toBe(presenceFingerprint(activity));
  });
});
