"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  readAnalyticsConsent,
  type AnalyticsConsent,
} from "@/consent/analytics-consent";
import {
  disablePosthogAnalytics,
  enablePosthogAnalytics,
} from "@/consent/posthog-analytics";

/**
 * Loads PostHog + Vercel Analytics only after the visitor grants cookie consent.
 */
export function ConsentedAnalytics() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    setConsent(readAnalyticsConsent());

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<AnalyticsConsent>).detail;
      if (detail === "granted" || detail === "denied") {
        setConsent(detail);
        return;
      }
      setConsent(readAnalyticsConsent());
    };

    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onChange);
    return () =>
      window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (consent === "granted") {
      enablePosthogAnalytics();
      return;
    }
    if (consent === "denied") {
      disablePosthogAnalytics();
    }
  }, [consent]);

  if (consent !== "granted") return null;

  return <Analytics />;
}
