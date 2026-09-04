import { en, type ActivityMessages } from "./messages/en";
import { pl } from "./messages/pl";

export type ActivityLocale = "en" | "pl";

export function detectActivityLanguage(): string {
  if (typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get("locale");
    if (fromUrl?.trim()) return fromUrl.trim();
  }
  return typeof navigator !== "undefined" ? navigator.language : "en";
}

/** Phase 1 ships English UI and English prompts only. Discord `locale` is ignored. */
export function resolveActivityLocale(_lang = detectActivityLanguage()): ActivityLocale {
  return "en";
}

const catalogs: Record<ActivityLocale, ActivityMessages> = { en, pl };

export function getActivityMessages(locale?: ActivityLocale): ActivityMessages {
  return catalogs[locale ?? resolveActivityLocale()];
}

type Dict = Record<string, unknown>;

function lookup(messages: ActivityMessages, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Dict)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function t(
  path: string,
  values?: Record<string, string | number>,
  locale?: ActivityLocale,
): string {
  const raw = lookup(getActivityMessages(locale), path) ?? path;
  if (!values) return raw;
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    raw,
  );
}
