import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { preloadPortalDestinations } from "../components/portal/destinationRegistry";

beforeAll(preloadPortalDestinations);

afterEach(() => {
  cleanup();
  globalThis.localStorage?.clear();
  if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
});
