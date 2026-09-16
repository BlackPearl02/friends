import { routePartykitRequest, Server } from "partyserver";
import type { Connection } from "partyserver";
import { isAuthorizedNotify } from "./notify-auth";
import { stripDiscordPartyPrefix } from "./party-path";

export type PartyEnv = {
  Main: DurableObjectNamespace<Main>;
  PARTY_SERVER_SECRET?: string;
};

/**
 * One Durable room per Discord Activity instanceId.
 * Nest POSTs a safe public patch; connected Activities receive it over WS.
 *
 * Binding name `Main` → PartyKit-compatible path `/parties/main/:roomId`.
 * Discord `/party` mapping may keep or strip the prefix — accept both.
 */
export class Main extends Server<PartyEnv> {
  // Hibernation has been flaky through Discord's Activity proxy; keep sockets warm.
  static options = { hibernate: false };

  onConnect(conn: Connection) {
    conn.send(JSON.stringify({ t: 1, kind: "roster" }));
  }

  async onRequest(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
    }

    const secret = this.env.PARTY_SERVER_SECRET;
    if (!isAuthorizedNotify(req.headers.get("Authorization"), secret)) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders() });
    }

    const payload = typeof body === "object" && body !== null ? body : { t: 1 };
    this.broadcast(JSON.stringify(payload));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: PartyEnv): Promise<Response> {
    const normalized = stripDiscordPartyPrefix(request);
    return (
      (await routePartykitRequest(normalized, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<PartyEnv>;

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
