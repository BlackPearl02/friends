import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages } from "@/i18n";
import { isLocale } from "@/i18n/locales";
import { buildPageMetadata } from "@/seo/metadata";

/** Public Squimbo support Discord invite (override with NEXT_PUBLIC_SUPPORT_DISCORD_URL). */
const DEFAULT_SUPPORT_DISCORD_URL = "https://discord.gg/PrQkDcxEqk";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const messages = getMessages(raw);
  return buildPageMetadata({
    locale: raw,
    path: "/support",
    title: messages.meta.supportTitle,
    description: messages.meta.supportDescription,
    ogImageAlt: messages.meta.ogImageAlt,
  });
}

export default async function SupportPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const m = getMessages(raw);
  const discordUrl =
    process.env.NEXT_PUBLIC_SUPPORT_DISCORD_URL || DEFAULT_SUPPORT_DISCORD_URL;

  return (
    <article className="prose-page">
      <h1>{m.support.title}</h1>
      <p>{m.support.intro}</p>

      <h2>{m.support.howTitle}</h2>
      <ul>
        <li>{m.support.how1}</li>
        <li>{m.support.how2}</li>
        <li>{m.support.how3}</li>
      </ul>

      <h2>{m.support.contactTitle}</h2>
      <p>
        {m.support.contactBody}{" "}
        <a href={discordUrl} target="_blank" rel="noopener noreferrer">
          {m.support.contactCta}
        </a>
      </p>
    </article>
  );
}
