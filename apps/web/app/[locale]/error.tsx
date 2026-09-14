"use client";

import { StatusScreen } from "@/components/StatusScreen";
import { discordPlayUrl } from "@/discord";
import { en } from "@/i18n/messages/en";
import { defaultLocale } from "@/i18n/locales";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ reset }: Props) {
  const copy = en.errors.unexpected;
  const playUrl =
    discordPlayUrl(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) ??
    "https://discord.com";

  return (
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
  );
}
