import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: class {
    send = sendMock;
  },
  GetParameterCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
}));

import { loadOpenAiKeyFromSsm } from "./loadOpenAiKeyFromSsm.js";

type CapturedCommand = { input?: { Name?: string; WithDecryption?: boolean } };

describe("loadOpenAiKeyFromSsm", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("reads the decrypted SecureString and sets OPENAI_API_KEY for openai", async () => {
    sendMock.mockResolvedValue({ Parameter: { Value: "  sk-from-ssm  " } });
    const env = {
      ASK_AI_PROVIDER: "openai",
      OPENAI_API_KEY_SSM_PARAM: "/thejudge/openai-api-key"
    } as NodeJS.ProcessEnv;

    await loadOpenAiKeyFromSsm(env);

    expect(env.OPENAI_API_KEY).toBe("sk-from-ssm");
    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0]?.[0] as CapturedCommand;
    expect(command.input).toEqual({ Name: "/thejudge/openai-api-key", WithDecryption: true });
  });

  it("defaults the parameter path when OPENAI_API_KEY_SSM_PARAM is unset", async () => {
    sendMock.mockResolvedValue({ Parameter: { Value: "sk-default-path" } });
    const env = { ASK_AI_PROVIDER: "openai" } as NodeJS.ProcessEnv;

    await loadOpenAiKeyFromSsm(env);

    const command = sendMock.mock.calls[0]?.[0] as CapturedCommand;
    expect(command.input).toEqual({ Name: "/thejudge/openai-api-key", WithDecryption: true });
  });

  it("no-ops for the mock provider (never calls SSM)", async () => {
    const env = { ASK_AI_PROVIDER: "mock" } as NodeJS.ProcessEnv;

    await loadOpenAiKeyFromSsm(env);

    expect(sendMock).not.toHaveBeenCalled();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it("does not overwrite an already-present key", async () => {
    const env = { ASK_AI_PROVIDER: "openai", OPENAI_API_KEY: "sk-local" } as NodeJS.ProcessEnv;

    await loadOpenAiKeyFromSsm(env);

    expect(sendMock).not.toHaveBeenCalled();
    expect(env.OPENAI_API_KEY).toBe("sk-local");
  });

  it("throws a clear error when the parameter has no value", async () => {
    sendMock.mockResolvedValue({ Parameter: { Value: "   " } });
    const env = {
      ASK_AI_PROVIDER: "openai",
      OPENAI_API_KEY_SSM_PARAM: "/thejudge/openai-api-key"
    } as NodeJS.ProcessEnv;

    await expect(loadOpenAiKeyFromSsm(env)).rejects.toThrow(/returned no value/);
  });
});
