/**
 * Lobby / idle heartbeats — Discord may pause the iframe briefly.
 * Activity polls ~750ms while open.
 */
export const PRESENCE_STALE_MS = 20_000;

/**
 * Mid-round drop is much worse than a sticky leaver — freeze-tolerant window.
 * pagehide still calls leave() for clean exits.
 */
export const PRESENCE_STALE_PLAYING_MS = 90_000;
