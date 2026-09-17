import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomPartyService } from "./room-party.service";

describe("RoomPartyService", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PARTYKIT_HOST;
    delete process.env.PARTY_SERVER_SECRET;
  });

  it("no-ops when PartyKit env is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const service = new RoomPartyService();
    await service.notifyRoomChanged("inst-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs a safe vote patch to the PartyKit room URL", async () => {
    process.env.PARTYKIT_HOST = "https://squimbo.example.partykit.dev/";
    process.env.PARTY_SERVER_SECRET = "party-secret";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    const service = new RoomPartyService();
    await service.notifyRoomChanged("inst-abc", {
      kind: "vote",
      votedUserId: "user-a",
      voteCount: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://squimbo.example.partykit.dev/parties/main/inst-abc");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      t: 1,
      kind: "vote",
      votedUserId: "user-a",
      voteCount: 1,
    });
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer party-secret");
    expect(init.signal).toBeDefined();
  });

  it("swallows AbortError when the Worker is too slow", async () => {
    process.env.PARTYKIT_HOST = "https://squimbo.example.partykit.dev";
    process.env.PARTY_SERVER_SECRET = "party-secret";
    const fetchMock = vi.fn().mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);

    const service = new RoomPartyService();
    await expect(service.notifyRoomChanged("inst-slow", { kind: "roster" })).resolves.toBeUndefined();
  });

  it("strips quoted CRLF artifacts from env piping", async () => {
    process.env.PARTYKIT_HOST = '"https://squimbo.example.partykit.dev\\r\\n"';
    process.env.PARTY_SERVER_SECRET = '"party-secret\\r\\n"';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    const service = new RoomPartyService();
    await service.notifyRoomChanged("inst-abc", { kind: "roster" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://squimbo.example.partykit.dev/parties/main/inst-abc");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer party-secret");
  });
});
