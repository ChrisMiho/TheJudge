import { afterEach, beforeAll } from "vitest";
import { resetCardMetadataForTests } from "../lib/cardMetadataStore";

// Test files that run in the node environment (DEC-155) draw no screen, so the
// DOM-only setup below is skipped for them; the portal registry is loaded by
// dynamic import inside the guard so those files never pay for importing it.
const hasDom = typeof document !== "undefined";

let cleanup: (() => void) | undefined;
let resetBackgroundDownloadForTests: (() => void) | undefined;

if (hasDom) {
  await import("@testing-library/jest-dom/vitest");
  ({ cleanup } = await import("@testing-library/react"));
  const registry = await import("../components/portal/destinationRegistry");
  resetBackgroundDownloadForTests = registry.resetBackgroundDownloadForTests;
  beforeAll(registry.preloadPortalDestinations);

  // jsdom has no layout engine and doesn't implement scrollIntoView (Slice D:
  // PrintingPicker.tsx scrolls the selected printing into view on open).
  if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView(): void {
      // no-op: jsdom has no scroll position to update
    };
  }
}

afterEach(() => {
  cleanup?.();
  resetCardMetadataForTests();
  resetBackgroundDownloadForTests?.();
  globalThis.localStorage?.clear();
  if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
});
