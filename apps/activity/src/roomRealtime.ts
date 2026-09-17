import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import {
  ROOM_REALTIME_EVENT,
  roomRealtimeTopic,
  type RoomRealtimePayload,
} from "@friends/types";

/**
 * Resolve a Discord-mapped relative path (e.g. `/sb`) against the Activity origin.
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

export function getSupabaseUrl(): string {
  return resolveMappedBase(import.meta.env.VITE_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

export function isRoomRealtimeConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

const INTENT_VALUES = new Set(["none", "continue", "wrap_up", "revote"]);

/**
 * Narrow Realtime payload to safe public fields (no vote targets).
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

/**
 * Subscribe to Supabase Realtime Broadcast wake-ups (+ optional public patch).
 * Discord maps `/sb` → project host. Caller applies the patch, then refetches via JWT.
 * Returns unsubscribe. Never throws — Realtime is best-effort over poll.
 */
export function subscribeRoomInvalidation(
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
          console.info("[squimbo-rt] vote", parsed.votedUserId, parsed.voteCount);
        }
        onInvalidate(parsed);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info("[squimbo-rt] supabase open", discordInstanceId);
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
