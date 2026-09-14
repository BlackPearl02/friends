import type { Locale } from "./locales";
import { en } from "./messages/en";

export type Messages = typeof en;

const catalogs: Record<Locale, Messages> = { en };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export function t(
  messages: Messages,
  path: string,
  vars?: Record<string, string>,
): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[part];
  }
  if (typeof cur !== "string") return path;
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}
