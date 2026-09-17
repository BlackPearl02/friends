import { activityUrl } from "./api";

/** Debug-mode ingest — localhost + Nest beacon (Discord cannot reach 127.0.0.1). */
export function dbgRt(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {},
): void {
  // #region agent log
  const payload = {
    sessionId: "ad8569",
    runId: "pre-fix",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  console.info("[squimbo-dbg]", hypothesisId, message, data);
  fetch("http://127.0.0.1:7448/ingest/2d9f4175-5569-407b-8d2d-66791077281a", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ad8569" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
  // Reach Nest via Discord `/api` mapping so we can read Vercel runtime logs.
  fetch(activityUrl("/debug/rt"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hypothesisId,
      message,
      data,
      timestamp: payload.timestamp,
    }),
  }).catch(() => undefined);
  // #endregion
}
