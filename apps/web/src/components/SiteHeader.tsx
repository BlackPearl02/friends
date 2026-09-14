"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import type { Messages } from "@/i18n";

type Props = {
  locale: Locale;
  messages: Messages;
};

export function SiteHeader({ locale, messages }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(/^\/en/, "") || "";
  const onLanding = rest === "" || rest === "/";
  const variant = onLanding ? "overlay" : "solid";

  return (
    <header className={`site-header site-header--${variant}`}>
      <Link href={`/${locale}`} className="site-header__home">
        {messages.landing.brand}
      </Link>
    </header>
  );
}
