import posthog from "posthog-js";

let started = false;

export function enablePosthogAnalytics(): void {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || typeof window === "undefined") return;

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  if (!started) {
    posthog.init(token, {
      api_host: host,
      defaults: "2026-05-30",
      persistence: "localStorage+cookie",
    });
    started = true;
    return;
  }

  posthog.opt_in_capturing();
}

export function disablePosthogAnalytics(): void {
  if (!started || typeof window === "undefined") return;
  posthog.opt_out_capturing();
}
