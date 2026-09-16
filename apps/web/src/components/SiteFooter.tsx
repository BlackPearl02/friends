import Link from "next/link";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";
import type { Locale } from "@/i18n/locales";
import type { Messages } from "@/i18n";
import { SEO_CONTENT_ROUTES, getSeoContentCopy } from "@/seo/content-routes";

type Props = {
  locale: Locale;
  messages: Messages;
};

export function SiteFooter({ locale, messages }: Props) {
  return (
    <footer className="site-footer">
      <p className="site-footer__tagline">{messages.footer.tagline}</p>
      <nav
        className="site-footer__links site-footer__links--learn"
        aria-label={messages.footer.learn}
      >
        {SEO_CONTENT_ROUTES.map((route) => (
          <Link key={route.path} href={`/${locale}${route.path}`}>
            {getSeoContentCopy(messages, route.path).footerLabel}
          </Link>
        ))}
      </nav>
      <nav className="site-footer__links" aria-label="Legal">
        <Link href={`/${locale}/privacy`}>{messages.footer.privacy}</Link>
        <Link href={`/${locale}/terms`}>{messages.footer.terms}</Link>
        <Link href={`/${locale}/support`}>{messages.footer.support}</Link>
        <CookieSettingsButton label={messages.footer.cookies} />
      </nav>
    </footer>
  );
}
