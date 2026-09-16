# Squimbo SEO

Marketing site: **https://squimbo.app** (English only, canonical paths under `/en`).

## Positioning

- Brand home (`/en`) owns “who knows the group best” and Squimbo as a product name.
- Content landings own broader / procedural search intents so the home page is not the only ranking URL.
- Voice: party host, short, factual — see product docs. Do not name competing brands or copy their listings.

## Keyword map → URLs

| Intent | Canonical URL |
|--------|----------------|
| Brand / who knows the group best | `/en` |
| Discord party game | `/en/discord-party-game` |
| Discord Activity / play inside Discord | `/en/discord-activity` |
| How to play Squimbo / start Activity | `/en/how-to-play` |
| Most likely / vote in the dark | `/en/most-likely` |
| No join code Discord game | `/en/no-join-code` |
| FAQ / long-tail Q&A | `/en/faq` |
| Support / legal | `/en/support`, `/en/privacy`, `/en/terms` |

Source of content routes for sitemap, footer Learn, and `llms.txt`: `apps/web/src/seo/content-routes.ts`.

## Structured data

- Home: `WebSite`, `Organization`, `SoftwareApplication` (Discord), `FAQPage`
- Content pages: `WebPage`, `BreadcrumbList`, `FAQPage`; `/how-to-play` also emits `HowTo`

## Rules

- **EN-only** on the marketing site for now (`locales = ["en"]`). `/pl` redirects to `/en`. Do not add hreflang until a real Polish catalog ships.
- Unique `title` + `description` per page via `buildPageMetadata` — no keyword stuffing.
- Internal links: home ↔ content pages ↔ Discord play CTA; footer Learn lists all content routes.
- Keep FAQ / HowTo JSON-LD accurate to on-page copy.

## Verify after deploy

1. `NEXT_PUBLIC_SITE_URL=https://squimbo.app` on the web production project.
2. HTTPS, canonicals on `/en…`, [sitemap.xml](https://squimbo.app/sitemap.xml), Open Graph previews.
3. All content URLs appear in the sitemap and in `/llms.txt`.
4. Google Search Console: submit sitemap if not already; spot-check FAQ / HowTo rich results where applicable.
