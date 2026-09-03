import { API_PATHS, type ActivityExchangeResponse, type PublicRoom, type PromptCategory, type RoundVoteRequest } from "@friends/types";

export type { ActivityExchangeResponse };

export function getActivityApiBaseUrl(): string {
  return import.meta.env.VITE_FRIENDS_API_URL?.trim().replace(/\/+$/, "") ?? "";
}

export function activityUrl(path: string): string {
  const base = getActivityApiBaseUrl();
  if (base) return `${base}${path}`;
  return `/api${path}`;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  return `HTTP ${res.status}${text ? `: ${text.slice(0, 180)}` : ""}`;
}

export async function exchangeActivityCode(body: { code: string }): Promise<ActivityExchangeResponse> {
  const res = await fetch(activityUrl(API_PATHS.activityExchange), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ActivityExchangeResponse;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function joinRoom(
  accessToken: string,
  body: { instanceId: string; channelId?: string | null; guildId?: string | null },
): Promise<PublicRoom> {
  const res = await fetch(activityUrl(API_PATHS.roomJoin), {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as PublicRoom;
}

export async function fetchRoom(accessToken: string, instanceId: string): Promise<PublicRoom> {
  const res = await fetch(
    `${activityUrl(API_PATHS.roomGet)}?instanceId=${encodeURIComponent(instanceId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as PublicRoom;
}

export async function startMatch(
  accessToken: string,
  instanceId: string,
  category: PromptCategory,
  locale: "en" | "pl",
): Promise<PublicRoom> {
  const res = await fetch(
    `${activityUrl(API_PATHS.roomStart)}?instanceId=${encodeURIComponent(instanceId)}`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({ category, locale }),
    },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as PublicRoom;
}

export async function voteRound(accessToken: string, body: RoundVoteRequest): Promise<PublicRoom> {
  const res = await fetch(activityUrl(API_PATHS.roundVote), {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as PublicRoom;
}

export async function revealRound(accessToken: string, instanceId: string): Promise<PublicRoom> {
  const res = await fetch(
    `${activityUrl(API_PATHS.roundReveal)}?instanceId=${encodeURIComponent(instanceId)}`,
    { method: "POST", headers: authHeaders(accessToken) },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as PublicRoom;
}
