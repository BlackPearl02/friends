import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, t } from "@/i18n";
import { isLocale } from "@/i18n/locales";
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
    path: "/terms",
    title: messages.meta.termsTitle,
    description: messages.meta.termsDescription,
    ogImageAlt: messages.meta.ogImageAlt,
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const m = getMessages(raw);
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <article className="prose-page">
      <h1>{m.terms.title}</h1>
      <p className="updated">{m.terms.updated}</p>

      <h2>{m.terms.s1Title}</h2>
      <p>{m.terms.s1Body}</p>

      <h2>{m.terms.s2Title}</h2>
      <p>{m.terms.s2Body}</p>

      <h2>{m.terms.s3Title}</h2>
      <p>{m.terms.s3Body}</p>

      <h2>{m.terms.s4Title}</h2>
      <p>{m.terms.s4Body}</p>

      <h2>{m.terms.s5Title}</h2>
      <p>{m.terms.s5Body}</p>

      <h2>{m.terms.s6Title}</h2>
      <p>{email ? t(m, "terms.s6Body", { email }) : m.terms.s6Missing}</p>
      {email ? (
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      ) : null}
    </article>
  );
}
