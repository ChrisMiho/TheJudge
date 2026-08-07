import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  globalThis.localStorage?.clear();
  if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
});
