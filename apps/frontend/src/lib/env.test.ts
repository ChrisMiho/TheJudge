import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl, resolveDebugLoggingEnabled } from "./env";

describe("frontend env config", () => {
  it("uses localhost backend default when unset", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("http://localhost:3000");
  });

  it("trims trailing slash from configured base url", () => {
    expect(resolveApiBaseUrl("https://api.example.com/")).toBe("https://api.example.com");
  });

  it("throws for invalid base url", () => {
    expect(() => resolveApiBaseUrl("not-a-url")).toThrow(/Invalid VITE_API_URL value/);
  });

  it("throws for unsupported protocol", () => {
    expect(() => resolveApiBaseUrl("ftp://example.com")).toThrow(/Only http and https are supported/);
  });

  it("enables debug logging by default in development mode", () => {
    expect(resolveDebugLoggingEnabled(undefined, true, "development")).toBe(true);
  });

  it("disables debug logging by default in test mode", () => {
    expect(resolveDebugLoggingEnabled(undefined, true, "test")).toBe(false);
  });

  it("supports explicit true/false debug logging overrides", () => {
    expect(resolveDebugLoggingEnabled("true", false, "production")).toBe(true);
    expect(resolveDebugLoggingEnabled("false", true, "development")).toBe(false);
  });

  it("throws for invalid debug logging values", () => {
    expect(() => resolveDebugLoggingEnabled("maybe", true, "development")).toThrow(/Invalid VITE_DEBUG_LOGGING value/);
  });
});
