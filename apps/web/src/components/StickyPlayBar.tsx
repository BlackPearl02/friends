"use client";

import { useEffect, useState } from "react";

type Props = {
  brand: string;
  ctaLabel: string;
  ctaHref: string;
  heroSelector?: string;
};

export function StickyPlayBar({
  brand,
  ctaLabel,
  ctaHref,
  heroSelector = "#hero",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(heroSelector);
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.12 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroSelector]);

  return (
    <div
      className={`sticky-play${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="sticky-play__inner">
        <span className="sticky-play__brand">{brand}</span>
        <a
          className="sticky-play__cta"
          href={ctaHref}
          rel="noopener noreferrer"
          tabIndex={visible ? 0 : -1}
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
