import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PromptMarquee } from "@/components/PromptMarquee";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { StickyPlayBar } from "@/components/StickyPlayBar";
import { discordPlayUrl } from "@/discord";
import { getMessages } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/locales";
import { buildPageMetadata } from "@/seo/metadata";
import { getSiteUrl } from "@/seo/site-url";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const messages = getMessages(raw);
  return buildPageMetadata({
    locale: raw,
    path: "",
    title: messages.meta.landingTitle,
    description: messages.meta.landingDescription,
    ogImageAlt: messages.meta.ogImageAlt,
    absoluteTitle: true,
  });
}

function buildLandingJsonLd(locale: Locale, playUrl: string | null) {
  const siteUrl = getSiteUrl();
  const messages = getMessages(locale);
  const pageUrl = `${siteUrl}/${locale}`;
  const L = messages.landing;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        name: messages.meta.siteName,
        url: pageUrl,
        description: messages.meta.landingDescription,
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": `${pageUrl}#organization`,
        name: messages.meta.siteName,
        url: pageUrl,
        logo: `${siteUrl}/squimbo-logo.png`,
      },
      {
        "@type": "SoftwareApplication",
        name: messages.meta.siteName,
        applicationCategory: "GameApplication",
        operatingSystem: "Discord",
        description: messages.meta.landingDescription,
        url: pageUrl,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        ...(playUrl
          ? {
              installUrl: playUrl,
              sameAs: [playUrl],
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: L.faq1Q,
            acceptedAnswer: { "@type": "Answer", text: L.faq1A },
          },
          {
            "@type": "Question",
            name: L.faq2Q,
            acceptedAnswer: { "@type": "Answer", text: L.faq2A },
          },
          {
            "@type": "Question",
            name: L.faq3Q,
            acceptedAnswer: { "@type": "Answer", text: L.faq3A },
          },
          {
            "@type": "Question",
            name: L.faq4Q,
            acceptedAnswer: { "@type": "Answer", text: L.faq4A },
          },
          {
            "@type": "Question",
            name: L.faq5Q,
            acceptedAnswer: { "@type": "Answer", text: L.faq5A },
          },
          {
            "@type": "Question",
            name: L.faq6Q,
            acceptedAnswer: { "@type": "Answer", text: L.faq6A },
          },
        ],
      },
    ],
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const messages = getMessages(raw);
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const playUrl = discordPlayUrl(clientId);
  const ctaHref = playUrl ?? "https://discord.com";
  const ctaLabel = playUrl ? messages.landing.cta : messages.landing.ctaFallback;
  const closeCta = playUrl ? messages.landing.closeCta : messages.landing.ctaFallback;

  return (
    <>
      <JsonLd data={buildLandingJsonLd(raw, playUrl)} />
      <StickyPlayBar brand={messages.landing.brand} ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <RevealOnScroll />

      <section id="hero" className="hero" aria-label={messages.landing.brand}>
        <div className="hero__stage" aria-hidden>
          <picture>
            <source media="(min-width: 768px)" srcSet="/squimbo-background.png" />
            <img
              src="/squimbo-background-mobile.png"
              alt=""
              width={1080}
              height={1920}
            />
          </picture>
        </div>
        <div className="hero__copy">
          <h1 className="hero__brand">{messages.landing.brand}</h1>
          <p className="hero__headline">{messages.landing.headline}</p>
          <p className="hero__subhead">{messages.landing.subhead}</p>
          <div className="hero__actions">
            <a className="hero__cta" href={ctaHref} rel="noopener noreferrer">
              {ctaLabel}
            </a>
            <a className="hero__link" href="#how">
              {messages.landing.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      <section className="entity" aria-label={messages.landing.brand}>
        <p className="entity__blurb">{messages.landing.entityBlurb}</p>
        <p className="entity__more">
          <Link href={`/${raw}/discord-party-game`}>
            {messages.landing.learnDiscordPartyGame}
          </Link>
          {" · "}
          <Link href={`/${raw}/discord-activity`}>
            {messages.landing.learnDiscordActivity}
          </Link>
        </p>
      </section>

      <section className="moment reveal" aria-labelledby="moment-title">
        <div className="moment__inner">
          <h2 id="moment-title" className="moment__title">
            {messages.landing.momentTitle}
          </h2>
          <p className="moment__body">{messages.landing.momentBody}</p>
          <p className="moment__more">
            <Link href={`/${raw}/most-likely`}>
              {messages.landing.learnMostLikely}
            </Link>
          </p>
        </div>
        <PromptMarquee prompts={messages.landing.prompts} />
      </section>

      <section id="how" className="how reveal" aria-labelledby="how-title">
        <div className="how__inner">
          <header className="how__header">
            <h2 id="how-title" className="how__title">
              {messages.landing.howTitle}
            </h2>
            <p className="how__lead">{messages.landing.howLead}</p>
          </header>
          <ol className="how__list">
            <li className="how__item">
              <span className="how__num" aria-hidden>
                01
              </span>
              <h3>{messages.landing.step1Title}</h3>
              <p>{messages.landing.step1Body}</p>
            </li>
            <li className="how__item">
              <span className="how__num" aria-hidden>
                02
              </span>
              <h3>{messages.landing.step2Title}</h3>
              <p>{messages.landing.step2Body}</p>
            </li>
            <li className="how__item">
              <span className="how__num" aria-hidden>
                03
              </span>
              <h3>{messages.landing.step3Title}</h3>
              <p>{messages.landing.step3Body}</p>
            </li>
          </ol>
          <p className="how__more">
            <Link href={`/${raw}/how-to-play`}>
              {messages.landing.learnHowToPlay}
            </Link>
          </p>
        </div>
      </section>

      <section className="fit reveal" aria-labelledby="fit-title">
        <div className="fit__copy">
          <h2 id="fit-title" className="fit__title">
            {messages.landing.fitTitle}
          </h2>
          <p className="fit__body">{messages.landing.fitBody}</p>
          <ul className="fit__points">
            <li>{messages.landing.fitPoint1}</li>
            <li>{messages.landing.fitPoint2}</li>
            <li>{messages.landing.fitPoint3}</li>
          </ul>
          <p className="fit__more">
            <Link href={`/${raw}/no-join-code`}>
              {messages.landing.learnNoJoinCode}
            </Link>
          </p>
        </div>
        <div className="fit__media">
          <img
            src="/squimbo-cover-art.png"
            alt={messages.meta.ogImageAlt}
            width={1152}
            height={864}
          />
        </div>
      </section>

      <section className="faq reveal" aria-labelledby="faq-title">
        <div className="faq__inner">
          <h2 id="faq-title" className="faq__title">
            {messages.landing.faqTitle}
          </h2>
          <div className="faq__list">
            <details className="faq__item">
              <summary>{messages.landing.faq1Q}</summary>
              <p>{messages.landing.faq1A}</p>
            </details>
            <details className="faq__item">
              <summary>{messages.landing.faq2Q}</summary>
              <p>{messages.landing.faq2A}</p>
            </details>
            <details className="faq__item">
              <summary>{messages.landing.faq3Q}</summary>
              <p>{messages.landing.faq3A}</p>
            </details>
            <details className="faq__item">
              <summary>{messages.landing.faq4Q}</summary>
              <p>{messages.landing.faq4A}</p>
            </details>
            <details className="faq__item">
              <summary>{messages.landing.faq5Q}</summary>
              <p>{messages.landing.faq5A}</p>
            </details>
            <details className="faq__item">
              <summary>{messages.landing.faq6Q}</summary>
              <p>{messages.landing.faq6A}</p>
            </details>
          </div>
          <p className="faq__more">
            <Link href={`/${raw}/faq`}>{messages.landing.learnFaq}</Link>
          </p>
        </div>
      </section>

      <section className="close reveal" aria-labelledby="close-title">
        <p className="close__brand">{messages.landing.closeBrand}</p>
        <h2 id="close-title" className="close__title">
          {messages.landing.closeTitle}
        </h2>
        <p className="close__body">{messages.landing.closeBody}</p>
        <a className="hero__cta" href={ctaHref} rel="noopener noreferrer">
          {closeCta}
        </a>
      </section>
    </>
  );
}
