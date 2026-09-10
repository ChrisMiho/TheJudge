import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { preloadPortalDestinations } from "../components/portal/destinationRegistry";

beforeAll(preloadPortalDestinations);

// jsdom has no layout engine and doesn't implement scrollIntoView (Slice D:
// PrintingPicker.tsx scrolls the selected printing into view on open).
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    // no-op: jsdom has no scroll position to update
  };
}

afterEach(() => {
  cleanup();
  globalThis.localStorage?.clear();
  if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
});
