import type { FeedbackEnvironmentSnapshot } from "./types";

const UNKNOWN = "unknown";

/**
 * The one impure hop in snapshot building: reads the browser/runtime facts that
 * cannot be passed in as data. Isolated here so `buildFeedbackContext()` stays
 * a pure function of its inputs.
 *
 * Every read is defensive — a missing `window`/`navigator` (non-DOM test
 * environment, SSR) degrades to placeholder values rather than throwing, because
 * a snapshot must never break the feedback form.
 */
export function readEnvironmentSnapshot(): FeedbackEnvironmentSnapshot {
  const timestamp = Date.now();

  return {
    userAgent: readUserAgent(),
    viewport: readViewport(),
    route: readRoute(),
    timestamp,
    capturedAt: new Date(timestamp).toISOString(),
    buildMode: readBuildMode(),
    appVersion: readAppVersion()
  };
}

function readUserAgent(): string {
  if (typeof navigator === "undefined" || typeof navigator.userAgent !== "string") {
    return UNKNOWN;
  }

  return navigator.userAgent;
}

function readViewport(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth ?? 0,
    height: window.innerHeight ?? 0
  };
}

function readRoute(): string {
  if (typeof window === "undefined" || !window.location) {
    return UNKNOWN;
  }

  const { pathname, search, hash } = window.location;
  return `${pathname ?? ""}${search ?? ""}${hash ?? ""}` || "/";
}

function readBuildMode(): string {
  const mode = import.meta.env.MODE;
  return typeof mode === "string" && mode.length > 0 ? mode : UNKNOWN;
}

function readAppVersion(): string {
  const version = import.meta.env.VITE_APP_VERSION;
  return typeof version === "string" && version.trim().length > 0 ? version.trim() : UNKNOWN;
}
