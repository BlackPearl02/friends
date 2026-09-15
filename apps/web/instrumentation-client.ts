/**
 * PostHog is initialized only after cookie consent
 * (`ConsentedAnalytics` + `enablePosthogAnalytics`).
 * This file stays so Next does not auto-load analytics on boot.
 */
export {};
