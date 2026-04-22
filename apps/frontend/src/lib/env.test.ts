import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "./env";

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
});
