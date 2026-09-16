# Squimbo launch checklist

Manual steps after the in-repo Friends → Squimbo rebrand. Engineering packages stay `@friends/*`.

## Domain (`squimbo.app`)

1. Register **squimbo.app** (~$10/yr on Vercel Domains or another registrar).
   - Vercel quote (team Projekty): ~**$9.99 USD / 1 year**, auto-renew optional, **non-refundable**.
   - Billing: [team billing](https://vercel.com/blackpearls-projects-c2dca206/~/settings/billing)
   - Domains dashboard: [team domains](https://vercel.com/blackpearls-projects-c2dca206/~/domains)
2. Attach the domain to the **web** Vercel project.
3. Set production env on the web project:
   - `NEXT_PUBLIC_SITE_URL=https://squimbo.app` (no trailing slash)
4. Confirm HTTPS and canonical URLs on `/en`, sitemap (including SEO content pages), and Open Graph. See [seo.md](./seo.md).

## Discord Developer Portal

1. Application **name** → **Squimbo**
2. Activity / store **description** → Squimbo (party game, vote in the dark, no join code)
3. Keep URL mappings (`/` → Activity, `/api` → API) unless hosts change
4. Cover art / logo filenames use `squimbo-*`; Discord listing can reuse `squimbo-cover-art.png` / `squimbo-logo.png`
5. Support guild (`1549781444300251270`) — channels/roles: [discord-support-server.md](./discord-support-server.md)
6. Ensure Activity Entry Point exists (`node scripts/register-discord-activity-entrypoint.mjs`). No bot invite / no Interactions Endpoint ([discord-activity-setup.md](./discord-activity-setup.md))

## Verify

- [ ] Activity shell title shows **Squimbo** (en + pl)
- [ ] Marketing site brand / FAQ / Privacy / Terms say **Squimbo**
- [ ] `https://squimbo.app` resolves to the web app
- [ ] Discord app listing shows **Squimbo**
