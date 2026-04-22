import { describe, expect, it } from "vitest";
import { readServerConfig } from "./config.js";

describe("backend env config", () => {
  it("uses local defaults when env is not set", () => {
    const config = readServerConfig({});
    expect(config).toEqual({ port: 3000, frontendOrigin: undefined });
  });

  it("parses explicit port and frontend origin", () => {
    const config = readServerConfig({
      PORT: "4567",
      FRONTEND_ORIGIN: "https://preview.thejudge.dev/"
    });

    expect(config).toEqual({
      port: 4567,
      frontendOrigin: "https://preview.thejudge.dev"
    });
  });

  it("throws on invalid port", () => {
    expect(() => readServerConfig({ PORT: "abc" })).toThrow(/Invalid PORT value/);
  });

  it("throws on invalid origin url", () => {
    expect(() => readServerConfig({ FRONTEND_ORIGIN: "localhost:5173" })).toThrow(/Invalid FRONTEND_ORIGIN/);
  });

  it("throws on unsupported origin protocol", () => {
    expect(() => readServerConfig({ FRONTEND_ORIGIN: "ftp://frontend.example.com" })).toThrow(
      /Only http and https are supported/
    );
  });
});
