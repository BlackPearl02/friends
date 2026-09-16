import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { ROOM_REALTIME_EVENT, roomRealtimeTopic } from "@friends/types";

/** Public anon URL — use Discord URL mapping `/sb` → project host in the iframe. */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function isRoomRealtimeConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/**
 * Subscribe to room wake-ups. Payload is ignored — caller must refetch via JWT.
 * Returns unsubscribe. No-ops when env is missing (poll-only fallback).
 */
export function subscribeRoomInvalidation(
  discordInstanceId: string,
  onInvalidate: () => void,
): () => void {
  if (!discordInstanceId || !isRoomRealtimeConfigured()) {
    return () => undefined;
  }

  let client: SupabaseClient | null = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: { eventsPerSecond: 8 },
    },
  });

  let channel: RealtimeChannel | null = client.channel(roomRealtimeTopic(discordInstanceId), {
    config: { broadcast: { self: false } },
  });

  channel = channel
    .on("broadcast", { event: ROOM_REALTIME_EVENT }, () => {
      onInvalidate();
    })
    .subscribe();

  return () => {
    if (client && channel) {
      void client.removeChannel(channel);
    }
    client = null;
    channel = null;
  };
}
