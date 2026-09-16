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
    path: "/faq",
    title: messages.meta.faqTitle,
    description: messages.meta.faqDescription,
    ogImageAlt: messages.meta.ogImageAlt,
  });
}

export default async function FaqPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const m = getMessages(raw);
  const P = m.faqPage;
  const playUrl = discordPlayUrl(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
  const ctaHref = playUrl ?? "https://discord.com";
  const ctaLabel = playUrl ? P.cta : m.landing.ctaFallback;

  return (
    <SeoContentPage
      locale={raw}
      path="/faq"
      title={P.title}
      lead={P.lead}
      breadcrumbLabel={m.footer.faq}
      homeLabel={m.breadcrumbs.home}
      sections={[]}
      faqTitle={P.faqTitle}
      faq={[
        { question: P.faq1Q, answer: P.faq1A },
        { question: P.faq2Q, answer: P.faq2A },
        { question: P.faq3Q, answer: P.faq3A },
        { question: P.faq4Q, answer: P.faq4A },
        { question: P.faq5Q, answer: P.faq5A },
        { question: P.faq6Q, answer: P.faq6A },
        { question: P.faq7Q, answer: P.faq7A },
        { question: P.faq8Q, answer: P.faq8A },
      ]}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
      relatedTitle={P.relatedTitle}
      related={getRelatedSeoLinks(m, "/faq")}
    />
  );
}
