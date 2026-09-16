import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import type { Locale } from "@/i18n/locales";
import { getSiteUrl } from "@/seo/site-url";

export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type SeoRelatedLink = {
  href: string;
  label: string;
};

export type SeoHowToStep = {
  name: string;
  text: string;
};

type Props = {
  locale: Locale;
  /** Path after locale, e.g. "/how-to-play". */
  path: string;
  title: string;
  lead: string;
  breadcrumbLabel: string;
  homeLabel: string;
  sections: Array<{
    title: string;
    body?: string;
    points?: readonly string[];
  }>;
  faqTitle: string;
  faq: SeoFaqItem[];
  ctaLabel: string;
  ctaHref: string;
  relatedTitle: string;
  related: SeoRelatedLink[];
  /** Optional HowTo schema (e.g. how-to-play). */
  howTo?: {
    name: string;
    description: string;
    steps: SeoHowToStep[];
  };
};

function buildContentJsonLd({
  pageUrl,
  siteUrl,
  locale,
  title,
  lead,
  breadcrumbLabel,
  homeLabel,
  faq,
  howTo,
}: {
  pageUrl: string;
  siteUrl: string;
  locale: Locale;
  title: string;
  lead: string;
  breadcrumbLabel: string;
  homeLabel: string;
  faq: SeoFaqItem[];
  howTo?: Props["howTo"];
}) {
  const homeUrl = `${siteUrl}/${locale}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description: lead,
      isPartOf: { "@id": `${homeUrl}#website` },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: homeLabel,
          item: homeUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: breadcrumbLabel,
          item: pageUrl,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  if (howTo) {
    graph.push({
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: howTo.name,
      description: howTo.description,
      step: howTo.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function SeoContentPage({
  locale,
  path,
  title,
  lead,
  breadcrumbLabel,
  homeLabel,
  sections,
  faqTitle,
  faq,
  ctaLabel,
  ctaHref,
  relatedTitle,
  related,
  howTo,
}: Props) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${locale}${path}`;

  return (
    <>
      <JsonLd
        data={buildContentJsonLd({
          pageUrl,
          siteUrl,
          locale,
          title,
          lead,
          breadcrumbLabel,
          homeLabel,
          faq,
          howTo,
        })}
      />
      <article className="prose-page">
        <nav className="prose-page__crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={`/${locale}`}>{homeLabel}</Link>
            </li>
            <li aria-current="page">{breadcrumbLabel}</li>
          </ol>
        </nav>

        <h1>{title}</h1>
        <p>{lead}</p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body ? <p>{section.body}</p> : null}
            {section.points && section.points.length > 0 ? (
              <ul>
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section aria-labelledby="seo-faq-title">
          <h2 id="seo-faq-title">{faqTitle}</h2>
          {faq.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>

        <p>
          <a className="hero__cta" href={ctaHref} rel="noopener noreferrer">
            {ctaLabel}
          </a>
        </p>

        <nav aria-labelledby="seo-related-title">
          <h2 id="seo-related-title">{relatedTitle}</h2>
          <ul>
            {related.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link href={`/${locale}${link.href}`}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </>
  );
}
