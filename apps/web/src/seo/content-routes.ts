import type { Messages } from "@/i18n";

/** Indexable marketing content pages (EN). Source of truth for sitemap + llms + footer. */
export const SEO_CONTENT_ROUTES = [
  {
    path: "/discord-party-game",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "/discord-activity",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "/how-to-play",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "/most-likely",
    changeFrequency: "monthly" as const,
    priority: 0.75,
  },
  {
    path: "/faq",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
] as const;

export type SeoContentPath = (typeof SEO_CONTENT_ROUTES)[number]["path"];

export function getSeoContentCopy(messages: Messages, path: SeoContentPath) {
  switch (path) {
    case "/discord-party-game":
      return {
        footerLabel: messages.footer.discordPartyGame,
        description: messages.meta.discordPartyGameDescription,
      };
    case "/discord-activity":
      return {
        footerLabel: messages.footer.discordActivity,
        description: messages.meta.discordActivityDescription,
      };
    case "/how-to-play":
      return {
        footerLabel: messages.footer.howToPlay,
        description: messages.meta.howToPlayDescription,
      };
    case "/most-likely":
      return {
        footerLabel: messages.footer.mostLikely,
        description: messages.meta.mostLikelyDescription,
      };
    case "/faq":
      return {
        footerLabel: messages.footer.faq,
        description: messages.meta.faqDescription,
      };
  }
}

/** Other content pages + home for “Keep reading” navs. */
export function getRelatedSeoLinks(
  messages: Messages,
  currentPath: SeoContentPath,
): Array<{ href: string; label: string }> {
  const others = SEO_CONTENT_ROUTES.filter((route) => route.path !== currentPath).map(
    (route) => ({
      href: route.path,
      label: getSeoContentCopy(messages, route.path).footerLabel,
    }),
  );
  return [...others, { href: "", label: messages.footer.home }];
}
