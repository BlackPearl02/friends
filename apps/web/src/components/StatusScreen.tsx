import Link from "next/link";

type Props = {
  brand: string;
  code?: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function StatusScreen({
  brand,
  code,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  onRetry,
  retryLabel,
}: Props) {
  return (
    <section className="status-screen" aria-labelledby="status-screen-title">
      <div className="status-screen__glow" aria-hidden="true" />
      <div className="status-screen__copy">
        <p className="status-screen__brand">{brand}</p>
        {code ? <p className="status-screen__code">{code}</p> : null}
        <h1 id="status-screen-title" className="status-screen__title">
          {title}
        </h1>
        <p className="status-screen__body">{body}</p>
        <div className="status-screen__actions">
          <a
            className="hero__cta"
            href={primaryHref}
            rel="noopener noreferrer"
          >
            {primaryLabel}
          </a>
          {onRetry && retryLabel ? (
            <button type="button" className="hero__link status-screen__retry" onClick={onRetry}>
              {retryLabel}
            </button>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="hero__link">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
