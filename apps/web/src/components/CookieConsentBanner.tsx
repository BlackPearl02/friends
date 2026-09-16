"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OPEN_COOKIE_CONSENT_EVENT,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/consent/analytics-consent";
import type { Locale } from "@/i18n/locales";
import type { Messages } from "@/i18n";

type Props = {
  locale: Locale;
  messages: Messages["cookies"];
};

export function CookieConsentBanner({ locale, messages }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readAnalyticsConsent() === null) {
      setVisible(true);
    }

    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_CONSENT_EVENT, onOpen);
  }, []);

  if (!visible) return null;

  const choose = (value: "granted" | "denied") => {
    writeAnalyticsConsent(value);
    setVisible(false);
  };

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-body"
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__copy">
          <p id="cookie-banner-title" className="cookie-banner__title">
            {messages.title}
          </p>
          <p id="cookie-banner-body" className="cookie-banner__body">
            {messages.body}{" "}
            <Link href={`/${locale}/privacy#cookies`}>
              {messages.privacyLink}
            </Link>
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--ghost"
            onClick={() => choose("denied")}
          >
            {messages.reject}
          </button>
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--primary"
            onClick={() => choose("granted")}
          >
            {messages.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
