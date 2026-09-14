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
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

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
      {email ? (
        <p>
          {t(m, "support.contactBody", { email })}{" "}
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      ) : (
        <p>{m.support.contactMissing}</p>
      )}
    </article>
  );
}
