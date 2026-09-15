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
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || undefined;

  return (
    <LegalDocument
      title={m.privacy.title}
      updated={m.privacy.updated}
      sections={m.privacy.sections}
      email={email}
      contactFallback={m.privacy.contactFallback}
    />
  );
}
