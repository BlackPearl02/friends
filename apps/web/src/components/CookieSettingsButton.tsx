"use client";

import { openCookieConsentBanner } from "@/consent/analytics-consent";

type Props = {
  label: string;
  className?: string;
};

/** Control to reopen the cookie consent banner (footer or inline prose). */
export function CookieSettingsButton({
  label,
  className = "site-footer__cookie-btn",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openCookieConsentBanner()}
    >
      {label}
    </button>
  );
}
