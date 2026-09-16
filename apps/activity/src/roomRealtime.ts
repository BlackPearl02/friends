import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { ROOM_REALTIME_EVENT, roomRealtimeTopic } from "@friends/types";

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

/**
 * Subscribe to room wake-ups. Payload is ignored — caller must refetch via JWT.
 * Returns unsubscribe. Never throws — Realtime is best-effort over poll.
 */
export function subscribeRoomInvalidation(
  discordInstanceId: string,
  onInvalidate: () => void,
): () => void {
  if (!discordInstanceId || !isRoomRealtimeConfigured()) {
    return () => undefined;
  }

  let client: SupabaseClient | null = null;
  let channel: RealtimeChannel | null = null;

  try {
    client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 8 },
      },
    });

    channel = client
      .channel(roomRealtimeTopic(discordInstanceId), {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: ROOM_REALTIME_EVENT }, () => {
        onInvalidate();
      })
      .subscribe();
  } catch {
    // Poll fallback remains — do not take down the Activity shell.
    return () => undefined;
  }

  return () => {
    if (client && channel) {
      void client.removeChannel(channel);
    }
    client = null;
    channel = null;
  };
}
