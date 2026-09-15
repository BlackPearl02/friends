export type AnalyticsConsent = "granted" | "denied";

export const ANALYTICS_CONSENT_KEY = "squimbo-analytics-consent";
export const ANALYTICS_CONSENT_CHANGE_EVENT = "squimbo-analytics-consent-change";
export const OPEN_COOKIE_CONSENT_EVENT = "squimbo-open-cookie-consent";

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // private mode / blocked storage
  }
  return null;
}

export function writeAnalyticsConsent(value: AnalyticsConsent): void {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_CHANGE_EVENT, { detail: value }),
  );
}

export function openCookieConsentBanner(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_CONSENT_EVENT));
}
