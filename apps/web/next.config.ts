import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reuse root Discord client id when NEXT_PUBLIC_* is unset (local monorepo).
  env: {
    NEXT_PUBLIC_DISCORD_CLIENT_ID:
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ||
      process.env.VITE_DISCORD_CLIENT_ID ||
      process.env.DISCORD_CLIENT_ID ||
      "",
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
    NEXT_PUBLIC_SUPPORT_DISCORD_URL:
      process.env.NEXT_PUBLIC_SUPPORT_DISCORD_URL || "",
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || "",
    NEXT_PUBLIC_POSTHOG_HOST:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
  },
};

export default nextConfig;
