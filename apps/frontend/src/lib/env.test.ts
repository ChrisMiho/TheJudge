import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl, resolveDebugLoggingEnabled, resolveIsMockProvider } from "./env";

describe("Frontend - Shared", () => {
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

  it("resolves mock provider only for the mock value", () => {
    expect(resolveIsMockProvider("mock")).toBe(true);
    expect(resolveIsMockProvider("openai")).toBe(false);
    expect(resolveIsMockProvider("")).toBe(false);
    expect(resolveIsMockProvider(undefined)).toBe(false);
    expect(resolveIsMockProvider("anthropic")).toBe(false);
  });

  it("normalizes case and whitespace when resolving mock provider", () => {
    expect(resolveIsMockProvider(" Mock ")).toBe(true);
    expect(resolveIsMockProvider("MOCK")).toBe(true);
  });

  it("never throws on unrecognized provider values", () => {
    expect(() => resolveIsMockProvider("something-weird")).not.toThrow();
  });
});
});
