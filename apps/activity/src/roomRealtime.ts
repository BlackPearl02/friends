import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import {
  ROOM_REALTIME_EVENT,
  partyRoomPath,
  roomRealtimeTopic,
  type RoomRealtimePayload,
} from "@friends/types";

/**
 * Resolve a Discord-mapped relative path (e.g. `/party`, `/sb`) against the Activity origin.
 */
export function resolveMappedBase(
  configured: string | undefined,
  origin: string | undefined = typeof window !== "undefined" ? window.location.origin : undefined,
): string {
  const raw = configured?.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "") ?? "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!origin) return "";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin.replace(/\/+$/, "")}${path}`;
}

/** @deprecated Prefer resolveMappedBase — kept for existing PartyKit tests. */
export function resolvePartyKitBase(
  configured: string | undefined,
  origin?: string,
): string {
  return resolveMappedBase(configured, origin);
}

export function getPartyKitBase(): string {
  return resolveMappedBase(import.meta.env.VITE_PARTYKIT_HOST);
}

export function getSupabaseUrl(): string {
  return resolveMappedBase(import.meta.env.VITE_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

export function isRoomRealtimeConfigured(): boolean {
  return Boolean(getPartyKitBase() || (getSupabaseUrl() && getSupabaseAnonKey()));
}

/** WebSocket URL for a Discord Activity instance room. */
export function partyRoomWebSocketUrl(
  configuredHost: string | undefined,
  discordInstanceId: string,
  origin?: string,
): string {
  const httpBase = resolveMappedBase(configuredHost, origin);
  if (!httpBase || !discordInstanceId) return "";
  const wsBase = httpBase.replace(/^http/i, "ws");
  return `${wsBase}${partyRoomPath(discordInstanceId)}`;
}

const INTENT_VALUES = new Set(["none", "continue", "wrap_up", "revote"]);

/**
 * Narrow PartyKit/Supabase payload to safe public fields (no vote targets).
 * Invalid shapes become a bare wake-up so GET still runs.
 */
export function parseRoomRealtimePayload(raw: unknown): RoomRealtimePayload {
  if (!raw || typeof raw !== "object") return { t: 1 };
  const o = raw as Record<string, unknown>;
  const payload: RoomRealtimePayload = { t: 1 };

  if (o.kind === "vote" || o.kind === "intent" || o.kind === "roster") {
    payload.kind = o.kind;
  }
  if (typeof o.votedUserId === "string" && o.votedUserId) {
    payload.votedUserId = o.votedUserId;
  }
  if (typeof o.voteCount === "number" && Number.isFinite(o.voteCount) && o.voteCount >= 0) {
    payload.voteCount = Math.floor(o.voteCount);
  }
  if (typeof o.intentUserId === "string" && o.intentUserId) {
    payload.intentUserId = o.intentUserId;
  }
  if (typeof o.intent === "string" && INTENT_VALUES.has(o.intent)) {
    payload.intent = o.intent as RoomRealtimePayload["intent"];
  }
  return payload;
}

const RECONNECT_MS = 2_000;

function subscribePartyKit(
  discordInstanceId: string,
  onInvalidate: (payload: RoomRealtimePayload) => void,
): () => void {
  const url = partyRoomWebSocketUrl(import.meta.env.VITE_PARTYKIT_HOST, discordInstanceId);
  if (!discordInstanceId || !url) {
    return () => undefined;
  }

  let stopped = false;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let sawFirstMessage = false;

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    clearReconnect();
    reconnectTimer = setTimeout(connect, RECONNECT_MS);
  };

  const connect = () => {
    if (stopped) return;
    clearReconnect();
    try {
      socket?.close();
    } catch {
      // ignore
    }
    socket = null;

    try {
      const ws = new WebSocket(url);
      socket = ws;

      ws.onopen = () => {
        console.info("[squimbo-rt] party open", discordInstanceId);
      };

      ws.onmessage = (event) => {
        if (!sawFirstMessage) {
          sawFirstMessage = true;
          console.info("[squimbo-rt] party first message", discordInstanceId);
        }
        let raw: unknown = event.data;
        if (typeof event.data === "string") {
          try {
            raw = JSON.parse(event.data) as unknown;
          } catch {
            raw = null;
          }
        }
        const payload = parseRoomRealtimePayload(raw);
        if (payload.kind === "vote") {
          console.info("[squimbo-rt] party vote", payload.votedUserId, payload.voteCount);
        }
        onInvalidate(payload);
      };

      ws.onclose = (ev) => {
        console.info(
          "[squimbo-rt] party close",
          discordInstanceId,
          `code=${ev.code}`,
          "Mapping /party → squimbo-party.foggy-boar.workers.dev (no https://)",
        );
        if (socket === ws) socket = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    } catch {
      scheduleReconnect();
    }
  };

  connect();

  return () => {
    stopped = true;
    clearReconnect();
    try {
      socket?.close();
    } catch {
      // ignore
    }
    socket = null;
  };
}

function subscribeSupabaseBroadcast(
  discordInstanceId: string,
  onInvalidate: (payload: RoomRealtimePayload) => void,
): () => void {
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!discordInstanceId || !url || !anon) {
    return () => undefined;
  }

  let client: SupabaseClient | null = null;
  let channel: RealtimeChannel | null = null;

  try {
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    channel = client
      .channel(roomRealtimeTopic(discordInstanceId), { config: { broadcast: { self: false } } })
      .on("broadcast", { event: ROOM_REALTIME_EVENT }, ({ payload }) => {
        const parsed = parseRoomRealtimePayload(payload);
        if (parsed.kind === "vote") {
          console.info("[squimbo-rt] sb vote", parsed.votedUserId, parsed.voteCount);
        }
        onInvalidate(parsed);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info("[squimbo-rt] sb open", discordInstanceId);
        }
      });
  } catch {
    return () => undefined;
  }

  return () => {
    if (channel && client) {
      void client.removeChannel(channel);
    }
    channel = null;
    client = null;
  };
}

/**
 * Subscribe to room wake-ups (+ optional public patch) via PartyKit and/or Supabase.
 * Caller applies the patch immediately, then refetches via JWT.
 * Returns unsubscribe. Never throws — Realtime is best-effort over poll.
 */
export function subscribeRoomInvalidation(
  discordInstanceId: string,
  onInvalidate: (payload: RoomRealtimePayload) => void,
): () => void {
  const unsubParty = subscribePartyKit(discordInstanceId, onInvalidate);
  const unsubSb = subscribeSupabaseBroadcast(discordInstanceId, onInvalidate);
  return () => {
    unsubParty();
    unsubSb();
  };
}
