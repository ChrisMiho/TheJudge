import type { AskAiProvider } from "./askAiProvider.js";

type BedrockReadinessConfig = {
  awsRegion: string;
  modelId: string;
};

export function createBedrockReadinessProvider(config: BedrockReadinessConfig): AskAiProvider {
  return {
    async generateAnswer() {
      throw new Error(
        `Bedrock provider is configured for readiness only (region=${config.awsRegion}, model=${config.modelId}). Runtime invocation is not enabled in Phase A.`
      );
    }
  };
}
