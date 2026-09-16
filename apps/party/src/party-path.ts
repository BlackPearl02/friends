/** Discord `/party` → host may forward `/party/parties/...` or `/parties/...`. */
export function stripDiscordPartyPrefix(request: Request): Request {
  const url = new URL(request.url);
  if (url.pathname === "/party" || url.pathname.startsWith("/party/")) {
    url.pathname = url.pathname.slice("/party".length) || "/";
    return new Request(url.toString(), request);
  }
  return request;
}
