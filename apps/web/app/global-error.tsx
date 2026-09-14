"use client";

import { Bricolage_Grotesque, Outfit } from "next/font/google";
import { StatusScreen } from "@/components/StatusScreen";
import { discordPlayUrl } from "@/discord";
import { en } from "@/i18n/messages/en";
import { defaultLocale } from "@/i18n/locales";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-display",
});

const body = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: Props) {
  const copy = en.errors.unexpected;
  const playUrl =
    discordPlayUrl(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) ??
    "https://discord.com";

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <StatusScreen
          brand={en.landing.brand}
          code={copy.code}
          title={copy.title}
          body={copy.body}
          primaryHref={playUrl}
          primaryLabel={copy.playCta}
          secondaryHref={`/${defaultLocale}`}
          secondaryLabel={copy.home}
          onRetry={reset}
          retryLabel={copy.retry}
        />
      </body>
    </html>
  );
}
