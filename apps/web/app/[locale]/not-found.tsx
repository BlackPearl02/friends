import type { Metadata } from "next";
import { StatusScreen } from "@/components/StatusScreen";
import { discordPlayUrl } from "@/discord";
import { getMessages } from "@/i18n";
import { defaultLocale } from "@/i18n/locales";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function LocaleNotFound() {
  const messages = getMessages(defaultLocale);
  const copy = messages.errors.notFound;
  const playUrl =
    discordPlayUrl(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) ??
    "https://discord.com";

  return (
    <StatusScreen
      brand={messages.landing.brand}
      code={copy.code}
      title={copy.title}
      body={copy.body}
      primaryHref={playUrl}
      primaryLabel={copy.playCta}
      secondaryHref={`/${defaultLocale}`}
      secondaryLabel={copy.home}
    />
  );
}
