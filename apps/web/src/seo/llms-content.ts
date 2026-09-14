import { getMessages } from "@/i18n";
import { defaultLocale } from "@/i18n/locales";
import { getSiteUrl } from "./site-url";

/** Curated llms.txt index (llmstxt.org CommonMark). */
export function buildLlmsTxt(): string {
  const site = getSiteUrl();
  const m = getMessages(defaultLocale);

  return [
    `# ${m.meta.siteName}`,
    "",
    `> ${m.meta.landingDescription}`,
    "",
    m.landing.entityBlurb,
    "",
    "This site is the public marketing and legal home for Friends. The game itself runs inside Discord as an Activity.",
    "",
    "## Product",
    "",
    `- [Friends home](${site}/en): ${m.meta.landingDescription}`,
    `- [Support](${site}/en/support): ${m.meta.supportDescription}`,
    "",
    "## Optional",
    "",
    `- [Privacy Policy](${site}/en/privacy): ${m.meta.privacyDescription}`,
    `- [Terms of Use](${site}/en/terms): ${m.meta.termsDescription}`,
    "",
  ].join("\n");
}

/** Expanded Markdown facts for agents that fetch llms-full.txt. */
export function buildLlmsFullTxt(): string {
  const site = getSiteUrl();
  const m = getMessages(defaultLocale);
  const L = m.landing;

  return [
    `# ${m.meta.siteName}`,
    "",
    `> ${m.meta.landingDescription}`,
    "",
    L.entityBlurb,
    "",
    `Canonical site: ${site}/en`,
    "",
    `## ${L.howTitle}`,
    "",
    L.howLead,
    "",
    `### 1. ${L.step1Title}`,
    "",
    L.step1Body,
    "",
    `### 2. ${L.step2Title}`,
    "",
    L.step2Body,
    "",
    `### 3. ${L.step3Title}`,
    "",
    L.step3Body,
    "",
    `## ${L.fitTitle}`,
    "",
    L.fitBody,
    "",
    `- ${L.fitPoint1}`,
    `- ${L.fitPoint2}`,
    `- ${L.fitPoint3}`,
    "",
    "## Product facts",
    "",
    `- ${L.spec1Label}: ${L.spec1Value}`,
    `- ${L.spec2Label}: ${L.spec2Value}`,
    `- ${L.spec3Label}: ${L.spec3Value}`,
    `- ${L.spec4Label}: ${L.spec4Value}`,
    "",
    `## ${L.faqTitle}`,
    "",
    `### ${L.faq1Q}`,
    "",
    L.faq1A,
    "",
    `### ${L.faq2Q}`,
    "",
    L.faq2A,
    "",
    `### ${L.faq3Q}`,
    "",
    L.faq3A,
    "",
    `### ${L.faq4Q}`,
    "",
    L.faq4A,
    "",
    "## Links",
    "",
    `- Home: ${site}/en`,
    `- Support: ${site}/en/support`,
    `- Privacy: ${site}/en/privacy`,
    `- Terms: ${site}/en/terms`,
    "",
  ].join("\n");
}
