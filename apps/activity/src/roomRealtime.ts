import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import {
  ROOM_REALTIME_EVENT,
  roomRealtimeTopic,
  type RoomRealtimePayload,
} from "@friends/types";

/**
 * Resolve Supabase URL for the Discord Activity sandbox.
 * `VITE_SUPABASE_URL=/sb` must become an absolute discordsays.com URL —
 * supabase-js rejects bare relative paths and can crash the React tree.
 */
export function resolveSupabaseUrl(
  configured: string | undefined,
  origin: string | undefined = typeof window !== "undefined" ? window.location.origin : undefined,
): string {
  const raw = configured?.trim().replace(/\/+$/, "") ?? "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!origin) return "";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin.replace(/\/+$/, "")}${path}`;
}

export function getSupabaseUrl(): string {
  return resolveSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function isRoomRealtimeConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

const INTENT_VALUES = new Set(["none", "continue", "wrap_up", "revote"]);

/**
 * Narrow Broadcast payload to safe public fields (no vote targets).
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

/**
 * Subscribe to room wake-ups (+ optional public patch).
 * Caller applies the patch immediately, then refetches via JWT.
 * Returns unsubscribe. Never throws — Realtime is best-effort over poll.
 */
export function subscribeRoomInvalidation(
  discordInstanceId: string,
  onInvalidate: (payload: RoomRealtimePayload) => void,
): () => void {
  if (!discordInstanceId || !isRoomRealtimeConfigured()) {
    return () => undefined;
  }

  let stopped = false;
  let client: SupabaseClient | null = null;
  let channel: RealtimeChannel | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const teardownChannel = () => {
    if (client && channel) {
      void client.removeChannel(channel);
    }
    channel = null;
  };

  const connect = () => {
    if (stopped) return;
    clearReconnect();
    teardownChannel();

    try {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();
      if (!client) {
        client = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
          realtime: {
            params: { eventsPerSecond: 10, apikey: key },
          },
        });
      }

      channel = client
        .channel(roomRealtimeTopic(discordInstanceId), {
          config: { broadcast: { self: true, ack: false } },
        })
        .on("broadcast", { event: ROOM_REALTIME_EVENT }, ({ payload }) => {
          onInvalidate(parseRoomRealtimePayload(payload));
        })
        .subscribe((status) => {
          if (stopped) return;
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            clearReconnect();
            reconnectTimer = setTimeout(connect, RECONNECT_MS);
          }
        });
    } catch {
      // Poll fallback remains — do not take down the Activity shell.
      clearReconnect();
      reconnectTimer = setTimeout(connect, RECONNECT_MS);
    }
  };

  connect();

  return () => {
    stopped = true;
    clearReconnect();
    teardownChannel();
    if (client) {
      void client.removeAllChannels();
    }
    client = null;
  };
}
