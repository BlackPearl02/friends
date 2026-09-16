import { partyRoomPath, type RoomRealtimePayload } from "@friends/types";

/**
 * Resolve PartyKit HTTP/WS base for the Discord Activity sandbox.
 * `VITE_PARTYKIT_HOST=/party` must become an absolute discordsays.com URL.
 */
export function resolvePartyKitBase(
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

export function getPartyKitBase(): string {
  return resolvePartyKitBase(import.meta.env.VITE_PARTYKIT_HOST);
}

export function isRoomRealtimeConfigured(): boolean {
  return Boolean(getPartyKitBase());
}

/** WebSocket URL for a Discord Activity instance room. */
export function partyRoomWebSocketUrl(
  configuredHost: string | undefined,
  discordInstanceId: string,
  origin?: string,
): string {
  const httpBase = resolvePartyKitBase(configuredHost, origin);
  if (!httpBase || !discordInstanceId) return "";
  const wsBase = httpBase.replace(/^http/i, "ws");
  return `${wsBase}${partyRoomPath(discordInstanceId)}`;
}

const INTENT_VALUES = new Set(["none", "continue", "wrap_up", "revote"]);

/**
 * Narrow PartyKit payload to safe public fields (no vote targets).
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
 * Subscribe to PartyKit room wake-ups (+ optional public patch).
 * Caller applies the patch immediately, then refetches via JWT.
 * Returns unsubscribe. Never throws — Realtime is best-effort over poll.
 */
export function subscribeRoomInvalidation(
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
        // Temporary connect telemetry — confirm Discord `/party` mapping delivers WS.
        console.info("[squimbo-party] open", discordInstanceId);
      };

      ws.onmessage = (event) => {
        if (!sawFirstMessage) {
          sawFirstMessage = true;
          console.info("[squimbo-party] first message", discordInstanceId);
        }
        let raw: unknown = event.data;
        if (typeof event.data === "string") {
          try {
            raw = JSON.parse(event.data) as unknown;
          } catch {
            raw = null;
          }
        }
        onInvalidate(parseRoomRealtimePayload(raw));
      };

      ws.onclose = () => {
        console.info("[squimbo-party] close", discordInstanceId);
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
