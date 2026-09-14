const DEV_FALLBACK = "http://localhost:3001";

let warnedMissingProd = false;

/**
 * Canonical site origin for metadata, sitemap, and llms.txt.
 * Trailing slashes are stripped. Falls back to localhost in development.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production" && !warnedMissingProd) {
    warnedMissingProd = true;
    console.warn(
      "[@friends/web] NEXT_PUBLIC_SITE_URL is unset; using localhost fallback for canonical URLs.",
    );
  }

  return DEV_FALLBACK;
}
