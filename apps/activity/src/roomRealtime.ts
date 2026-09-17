import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import {
  ROOM_REALTIME_EVENT,
  roomRealtimeTopic,
  type RoomRealtimePayload,
} from "@friends/types";
import { dbgRt } from "./dbgRt";

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

type ActiveRoomRt = {
  client: SupabaseClient;
  channel: RealtimeChannel;
};

/** Live rooms for client→peer fanout (same channel as subscribe). */
const activeRooms = new Map<string, ActiveRoomRt>();

/**
 * Narrow Realtime payload to safe public fields (no vote targets).
 * Invalid shapes become a bare wake-up so GET still runs.
 */
export function parseRoomRealtimePayload(raw: unknown): RoomRealtimePayload {
  if (!raw || typeof raw !== "object") return { t: 1 };
  const o = raw as Record<string, unknown>;
  const payload: RoomRealtimePayload = { t: 1 };

  if (
    o.kind === "vote" ||
    o.kind === "intent" ||
    o.kind === "roster" ||
    o.kind === "reveal" ||
    o.kind === "round"
  ) {
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
  if (typeof o.revealedAt === "string" && o.revealedAt) {
    payload.revealedAt = o.revealedAt;
  }
  if (typeof o.serverTime === "string" && o.serverTime) {
    payload.serverTime = o.serverTime;
  }
  if (typeof o.roundId === "string" && o.roundId) {
    payload.roundId = o.roundId;
  }
  if (typeof o.roundIndex === "number" && Number.isFinite(o.roundIndex) && o.roundIndex >= 0) {
    payload.roundIndex = Math.floor(o.roundIndex);
  }
  const prompt = parsePublicPrompt(o.prompt);
  if (prompt) {
    payload.prompt = prompt;
  }
  return payload;
}

const PROMPT_KINDS = new Set(["most_likely", "this_or_that", "truth", "challenge"]);
const PROMPT_CATEGORIES = new Set(["party", "family", "colleagues", "spicy"]);

function parsePublicPrompt(raw: unknown): RoomRealtimePayload["prompt"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id) return undefined;
  if (typeof p.kind !== "string" || !PROMPT_KINDS.has(p.kind)) return undefined;
  if (typeof p.body !== "string" || !p.body) return undefined;
  const category =
    p.category === null
      ? null
      : typeof p.category === "string" && PROMPT_CATEGORIES.has(p.category)
        ? (p.category as "party" | "family" | "colleagues" | "spicy")
        : null;
  return {
    id: p.id,
    kind: p.kind as "most_likely" | "this_or_that" | "truth" | "challenge",
    category,
    body: p.body,
    optionA: typeof p.optionA === "string" ? p.optionA : null,
    optionB: typeof p.optionB === "string" ? p.optionB : null,
  };
}

/** Optional client fanout clock (ms) — debug latency only, stripped from typed payload. */
export function readFanoutSentAt(raw: unknown): number | null {
  if (!raw || typeof raw !== "object") return null;
  const tSent = (raw as Record<string, unknown>).tSent;
  return typeof tSent === "number" && Number.isFinite(tSent) ? tSent : null;
}

/**
 * Optimistic peer patch at click time (before Nest returns).
 * Only call with the local user's id / intent — never peer ids from the client.
 */
export function publishRoomPatch(
  discordInstanceId: string,
  patch: Omit<RoomRealtimePayload, "t">,
): void {
  const active = activeRooms.get(discordInstanceId);
  if (!active) {
    // #region agent log
    dbgRt("H11", "roomRealtime.ts:publish", "publish_no_channel", {
      kind: patch.kind ?? "wake",
    });
    // #endregion
    return;
  }

  const tSent = Date.now();
  const payload = { t: 1 as const, ...patch, tSent };
  void active.channel
    .send({
      type: "broadcast",
      event: ROOM_REALTIME_EVENT,
      payload,
    })
    .then((status) => {
      // #region agent log
      dbgRt("H11", "roomRealtime.ts:publish", "client_fanout_sent", {
        kind: patch.kind ?? "wake",
        status,
        tSent,
      });
      // #endregion
    })
    .catch((err: unknown) => {
      // #region agent log
      dbgRt("H11", "roomRealtime.ts:publish", "client_fanout_error", {
        kind: patch.kind ?? "wake",
        err: err instanceof Error ? err.message.slice(0, 80) : "unknown",
      });
      // #endregion
    });
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
    // #region agent log
    dbgRt("H1", "roomRealtime.ts:subscribe", "realtime_not_configured", {
      hasUrl: Boolean(url),
      hasAnon: Boolean(anon),
      instanceLen: discordInstanceId.length,
    });
    // #endregion
    return () => undefined;
  }

  // #region agent log
  dbgRt("H1", "roomRealtime.ts:subscribe", "subscribe_start", {
    urlHost: url.slice(0, 48),
    topic: roomRealtimeTopic(discordInstanceId),
  });
  // #endregion

  let client: SupabaseClient | null = null;
  let channel: RealtimeChannel | null = null;

  try {
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    channel = client
      .channel(roomRealtimeTopic(discordInstanceId), { config: { broadcast: { self: false } } })
      .on("broadcast", { event: ROOM_REALTIME_EVENT }, ({ payload }) => {
        const raw = payload;
        const parsed = parseRoomRealtimePayload(raw);
        const tSent = readFanoutSentAt(raw);
        const tClient = Date.now();
        // #region agent log
        dbgRt("H3", "roomRealtime.ts:broadcast", "broadcast_received", {
          kind: parsed.kind ?? "wake",
          hasVotedUserId: Boolean(parsed.votedUserId),
          voteCount: parsed.voteCount ?? null,
          tClient,
          tSent,
          latencyMs: tSent != null ? tClient - tSent : null,
          fromClientFanout: tSent != null,
        });
        // #endregion
        if (parsed.kind === "vote") {
          console.info("[squimbo-rt] vote", parsed.votedUserId, parsed.voteCount);
        }
        onInvalidate(parsed);
      })
      .subscribe((status) => {
        // #region agent log
        dbgRt("H1", "roomRealtime.ts:subscribe", "subscribe_status", { status });
        // #endregion
        if (status === "SUBSCRIBED") {
          console.info("[squimbo-rt] supabase open", discordInstanceId);
        }
      });
    activeRooms.set(discordInstanceId, { client, channel });
  } catch (err: unknown) {
    // #region agent log
    dbgRt("H1", "roomRealtime.ts:subscribe", "subscribe_throw", {
      err: err instanceof Error ? err.message : "unknown",
    });
    // #endregion
    return () => undefined;
  }

  return () => {
    activeRooms.delete(discordInstanceId);
    if (channel && client) {
      void client.removeChannel(channel);
    }
    channel = null;
    client = null;
  };
}
