import { dbgRt } from "./dbgRt";

function hostnameOf(originOrUrl: string): string {
  if (!originOrUrl || originOrUrl === "*") return "*";
  try {
    return new URL(originOrUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Safe env snapshot for Nest dbg-rt (no tokens / full URLs with ids). */
export function logDiscordEmbedProbe(extra: Record<string, unknown> = {}): void {
  const params = new URLSearchParams(window.location.search);
  const referrerHost = hostnameOf(document.referrer);
  // #region agent log
  dbgRt("H8", "discordRpcTarget.ts:probe", "embed_probe", {
    host: window.location.hostname,
    inIframe: window.parent !== window,
    hasParentOpener: Boolean(window.parent.opener),
    referrerHost: referrerHost || (document.referrer ? "unparsed" : "empty"),
    queryKeys: [...params.keys()].sort().join(","),
    hasFrameId: Boolean(params.get("frame_id")),
    platform: params.get("platform") ?? "",
    ...extra,
  });
  // #endregion
}
