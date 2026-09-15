"use client";

import { openCookieConsentBanner } from "@/consent/analytics-consent";

type Props = {
  label: string;
};

/** Footer control to reopen the cookie consent banner. */
export function CookieSettingsButton({ label }: Props) {
  return (
    <button
      type="button"
      className="site-footer__cookie-btn"
      onClick={() => openCookieConsentBanner()}
    >
      {label}
    </button>
  );
}
