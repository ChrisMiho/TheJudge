import { useLayoutEffect, useRef } from "react";
import { isMockProvider } from "../lib/env";

const MOCK_MODE_COPY = "⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend";

/**
 * Custom property the shell's top offset reads. Published from the banner's own measured
 * height rather than assumed, because the banner is `position: fixed` and therefore
 * reserves no flow space of its own: a hardcoded offset silently stops clearing the
 * banner as soon as its copy wraps to a second line at narrow widths (REQ-123).
 */
const BANNER_HEIGHT_PROPERTY = "--mock-banner-height";

/**
 * Persistent, non-dismissible banner shown at the top of every screen when the
 * app is built/run with the mock AI provider (`ASK_AI_PROVIDER=mock`). Renders
 * nothing in live builds. Presentation only — no state, no controls, no motion.
 */
export function MockModeBanner(): JSX.Element | null {
  const bannerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    function publishHeight(): void {
      if (!banner) return;
      const { height } = banner.getBoundingClientRect();
      // Destinations are kept mounted while inactive, so several banners exist at once and
      // the inactive ones measure 0. Only a rendered banner may publish, or an inactive
      // one would zero out the offset the visible shell depends on.
      if (height <= 0) return;
      document.documentElement.style.setProperty(BANNER_HEIGHT_PROPERTY, `${height}px`);
    }

    publishHeight();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(publishHeight);
    observer.observe(banner);
    return () => observer.disconnect();
  }, []);

  if (!isMockProvider) {
    return null;
  }

  return (
    <div ref={bannerRef} className="mock-mode-banner" role="status">
      {MOCK_MODE_COPY}
    </div>
  );
}
