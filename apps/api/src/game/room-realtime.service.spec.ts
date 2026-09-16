import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomRealtimeService } from "./room-realtime.service";

describe("RoomRealtimeService", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it("no-ops when Supabase env is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const service = new RoomRealtimeService();
    await service.notifyRoomChanged("inst-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs a wake-up-only broadcast for the room topic", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const service = new RoomRealtimeService();
    await service.notifyRoomChanged("inst-abc");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.supabase.co/realtime/v1/api/broadcast");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as {
      messages: Array<{ topic: string; event: string; payload: unknown }>;
    };
    expect(body.messages[0]).toEqual({
      topic: "room:inst-abc",
      event: "room_changed",
      payload: { t: 1 },
    });
    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBe("service-role-test");
  });
});
