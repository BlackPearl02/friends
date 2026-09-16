/**
 * Coalesce room refreshes so a Realtime ping during an in-flight GET is not dropped.
 */
export function createRoomRefreshGate(run: () => Promise<void>): {
  request: () => void;
  /** Test helper — whether another pass is queued. */
  isPending: () => boolean;
} {
  let inFlight = false;
  let pending = false;
  let cancelled = false;

  const request = () => {
    if (cancelled) return;
    if (inFlight) {
      pending = true;
      return;
    }
    inFlight = true;
    void run()
      .catch(() => undefined)
      .finally(() => {
        inFlight = false;
        if (cancelled) return;
        if (pending) {
          pending = false;
          request();
        }
      });
  };

  return {
    request,
    isPending: () => pending,
    // @internal cancel via closure — callers drop the gate on effect cleanup
  };
}

/** True when GET /rooms/current says we were dropped from the roster. */
export function isRoomMembershipLostError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("http 403") || msg.includes("not in this room");
}
