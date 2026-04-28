import { describe, expect, it } from "vitest";
import { readServerConfig } from "./config.js";

describe("backend env config", () => {
  it("uses local defaults when env is not set", () => {
    const config = readServerConfig({});
    expect(config).toEqual({
      port: 3000,
      frontendOrigin: undefined,
      debugLoggingEnabled: false,
      payloadLoggingEnabled: false,
      askAiProvider: "mock",
      awsRegion: undefined,
      bedrockModelId: undefined
    });
  });

  it("parses explicit port and frontend origin", () => {
    const config = readServerConfig({
      PORT: "4567",
      FRONTEND_ORIGIN: "https://preview.thejudge.dev/",
      DEBUG_LOGGING: "true"
    });

    expect(config).toEqual({
      port: 4567,
      frontendOrigin: "https://preview.thejudge.dev",
      debugLoggingEnabled: true,
      payloadLoggingEnabled: false,
      askAiProvider: "mock",
      awsRegion: undefined,
      bedrockModelId: undefined
    });
  });

  it("parses bedrock readiness config when requested", () => {
    const config = readServerConfig({
      ASK_AI_PROVIDER: "bedrock",
      AWS_REGION: "us-east-1",
      BEDROCK_MODEL_ID: "anthropic.claude-v2"
    });

    expect(config.askAiProvider).toBe("bedrock");
    expect(config.awsRegion).toBe("us-east-1");
    expect(config.bedrockModelId).toBe("anthropic.claude-v2");
  });

  it("normalizes provider selection casing and surrounding whitespace", () => {
    const config = readServerConfig({
      ASK_AI_PROVIDER: "  BeDrOcK  ",
      AWS_REGION: " us-east-1 ",
      BEDROCK_MODEL_ID: " anthropic.claude-v2 "
    });

    expect(config.askAiProvider).toBe("bedrock");
    expect(config.awsRegion).toBe("us-east-1");
    expect(config.bedrockModelId).toBe("anthropic.claude-v2");
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

  it("throws on invalid DEBUG_LOGGING values", () => {
    expect(() => readServerConfig({ DEBUG_LOGGING: "maybe" })).toThrow(/Invalid DEBUG_LOGGING value/);
  });

  it("parses LOG_PAYLOADS toggle and defaults to enabled in development", () => {
    expect(readServerConfig({ NODE_ENV: "development" }).payloadLoggingEnabled).toBe(true);
    expect(readServerConfig({ LOG_PAYLOADS: "false" }).payloadLoggingEnabled).toBe(false);
    expect(readServerConfig({ LOG_PAYLOADS: "true" }).payloadLoggingEnabled).toBe(true);
  });

  it("throws on invalid LOG_PAYLOADS values", () => {
    expect(() => readServerConfig({ LOG_PAYLOADS: "sometimes" })).toThrow(/Invalid LOG_PAYLOADS value/);
  });

  it("throws on invalid provider selection", () => {
    expect(() => readServerConfig({ ASK_AI_PROVIDER: "openai" })).toThrow(/Invalid ASK_AI_PROVIDER value/);
  });

  it("throws when bedrock provider is missing required env", () => {
    expect(() => readServerConfig({ ASK_AI_PROVIDER: "bedrock", AWS_REGION: "us-east-1" })).toThrow(
      /requires both AWS_REGION and BEDROCK_MODEL_ID/
    );
  });

  it("throws when bedrock provider omits AWS_REGION", () => {
    expect(() => readServerConfig({ ASK_AI_PROVIDER: "bedrock", BEDROCK_MODEL_ID: "anthropic.claude-v2" })).toThrow(
      /requires both AWS_REGION and BEDROCK_MODEL_ID/
    );
  });
});
