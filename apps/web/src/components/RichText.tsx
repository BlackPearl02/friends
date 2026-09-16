import type { ReactNode } from "react";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";

type Props = {
  text: string;
  locale: string;
  /** Replaces `{email}` with a mailto link when set. */
  email?: string;
  /** Resolves markdown href `discord:invite`. */
  discordInviteUrl?: string;
};

const TOKEN_RE =
  /\[([^\]]+)\]\(([^)]+)\)|\{email\}/g;

function isExternalHref(href: string) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:")
  );
}

function resolveHref(
  href: string,
  locale: string,
  discordInviteUrl?: string,
): string | null {
  if (href === "cookie:settings") return null;
  if (href === "discord:invite") {
    return discordInviteUrl ?? null;
  }
  if (href.startsWith("/")) {
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return `/${locale}${href}`;
    const path = href.slice(0, hashIndex);
    const hash = href.slice(hashIndex);
    return `/${locale}${path}${hash}`;
  }
  return href;
}

/**
 * Renders catalog copy with optional markdown links `[label](href)`,
 * `{email}` mailto, `cookie:settings`, and `discord:invite`.
 */
export function RichText({ text, locale, email, discordInviteUrl }: Props) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[0] === "{email}") {
      if (email) {
        nodes.push(
          <a key={key++} href={`mailto:${email}`}>
            {email}
          </a>,
        );
      } else {
        nodes.push("{email}");
      }
    } else {
      const label = match[1];
      const href = match[2];

      if (href === "cookie:settings") {
        nodes.push(
          <CookieSettingsButton
            key={key++}
            label={label}
            className="prose-page__inline-action"
          />,
        );
      } else {
        const resolved = resolveHref(href, locale, discordInviteUrl);
        if (!resolved) {
          nodes.push(label);
        } else if (isExternalHref(resolved) || resolved.startsWith("mailto:")) {
          nodes.push(
            <a
              key={key++}
              href={resolved}
              {...(resolved.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {label}
            </a>,
          );
        } else {
          nodes.push(
            <Link key={key++} href={resolved}>
              {label}
            </Link>,
          );
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}
