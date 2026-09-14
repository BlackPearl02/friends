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
    path: "/privacy",
    title: messages.meta.privacyTitle,
    description: messages.meta.privacyDescription,
    ogImageAlt: messages.meta.ogImageAlt,
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const m = getMessages(raw);
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <article className="prose-page">
      <h1>{m.privacy.title}</h1>
      <p className="updated">{m.privacy.updated}</p>

      <h2>{m.privacy.s1Title}</h2>
      <p>{m.privacy.s1Body}</p>

      <h2>{m.privacy.s2Title}</h2>
      <p>{m.privacy.s2Body}</p>

      <h2>{m.privacy.s3Title}</h2>
      <p>{m.privacy.s3Body}</p>

      <h2>{m.privacy.s4Title}</h2>
      <p>{m.privacy.s4Body}</p>

      <h2>{m.privacy.s5Title}</h2>
      <p>{m.privacy.s5Body}</p>

      <h2>{m.privacy.s6Title}</h2>
      <p>{m.privacy.s6Body}</p>

      <h2>{m.privacy.s7Title}</h2>
      <p>
        {email
          ? t(m, "privacy.s7Body", { email })
          : m.privacy.s7Missing}
      </p>
      {email ? (
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      ) : null}

      <h2>{m.privacy.s8Title}</h2>
      <p>{m.privacy.s8Body}</p>
    </article>
  );
}
