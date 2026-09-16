import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/LegalDocument";
import { getMessages } from "@/i18n";
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
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined;

  return (
    <LegalDocument
      locale={raw}
      title={m.terms.title}
      updated={m.terms.updated}
      sections={m.terms.sections}
      email={email}
      contactFallback={m.terms.contactFallback}
    />
  );
}
