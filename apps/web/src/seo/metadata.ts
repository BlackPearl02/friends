import type { Metadata } from "next";
import type { Locale } from "@/i18n/locales";
import { getSiteUrl } from "./site-url";

const OG_IMAGE = "/squimbo-cover-art.png";
const SITE_NAME = "Squimbo";

type BuildPageMetadataArgs = {
  locale: Locale;
  /** Path after locale, e.g. "" for landing or "/privacy". */
  path: string;
  title: string;
  description: string;
  ogImageAlt?: string;
  ogType?: "website" | "article";
  /** When true, skip "%s | Squimbo" template (landing already includes the brand). */
  absoluteTitle?: boolean;
};

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  ogImageAlt = "Squimbo — Discord party game cover art",
  ogType = "website",
  absoluteTitle = false,
}: BuildPageMetadataArgs): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = path === "/" ? "" : path;
  const canonicalPath = `/${locale}${normalizedPath}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_US" : locale,
      type: ogType,
      images: [
        {
          url: OG_IMAGE,
          width: 1152,
          height: 864,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
