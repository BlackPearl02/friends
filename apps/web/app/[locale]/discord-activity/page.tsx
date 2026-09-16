import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoContentPage } from "@/components/SeoContentPage";
import { discordPlayUrl } from "@/discord";
import { getMessages } from "@/i18n";
import { isLocale } from "@/i18n/locales";
import { getRelatedSeoLinks } from "@/seo/content-routes";
import { buildPageMetadata } from "@/seo/metadata";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const messages = getMessages(raw);
  return buildPageMetadata({
    locale: raw,
    path: "/discord-activity",
    title: messages.meta.discordActivityTitle,
    description: messages.meta.discordActivityDescription,
    ogImageAlt: messages.meta.ogImageAlt,
  });
}

export default async function DiscordActivityPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const m = getMessages(raw);
  const P = m.discordActivity;
  const playUrl = discordPlayUrl(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
  const ctaHref = playUrl ?? "https://discord.com";
  const ctaLabel = playUrl ? P.cta : m.landing.ctaFallback;

  return (
    <SeoContentPage
      locale={raw}
      path="/discord-activity"
      title={P.title}
      lead={P.lead}
      breadcrumbLabel={m.footer.discordActivity}
      homeLabel={m.breadcrumbs.home}
      sections={[
        { title: P.section1Title, body: P.section1Body },
        {
          title: P.section2Title,
          body: P.section2Body,
          points: [P.section2Point1, P.section2Point2, P.section2Point3],
        },
        { title: P.section3Title, body: P.section3Body },
      ]}
      faqTitle={P.faqTitle}
      faq={[
        { question: P.faq1Q, answer: P.faq1A },
        { question: P.faq2Q, answer: P.faq2A },
        { question: P.faq3Q, answer: P.faq3A },
      ]}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      relatedTitle={P.relatedTitle}
      related={getRelatedSeoLinks(m, "/discord-activity")}
    />
  );
}
