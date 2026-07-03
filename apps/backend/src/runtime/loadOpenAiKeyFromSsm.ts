import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const DEFAULT_SSM_PARAM = "/thejudge/openai-api-key";

/**
 * Lambda-only cold-start helper. When the deployed function runs with
 * `ASK_AI_PROVIDER=openai` and no `OPENAI_API_KEY` is already present, read the
 * key from an SSM Parameter Store SecureString (decrypted) and place it on
 * `env.OPENAI_API_KEY` so the shared config/provider boundary is unchanged.
 *
 * The key never enters Git, the repo, GitHub, or the Lambda function
 * configuration — only the parameter path travels via env. Local `dev`
 * (provider `mock`, or `openai` with the key sourced from
 * `.secrets/openai-dev.env`) never reaches the SSM read.
 */
export async function loadOpenAiKeyFromSsm(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (env.ASK_AI_PROVIDER?.trim().toLowerCase() !== "openai") return;
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== "") return;

  const parameterName = env.OPENAI_API_KEY_SSM_PARAM?.trim() || DEFAULT_SSM_PARAM;
  const client = new SSMClient({});
  const response = await client.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));

  const value = response.Parameter?.Value?.trim();
  if (!value) {
    throw new Error(
      `SSM parameter '${parameterName}' returned no value. Set the SecureString before deploying with ASK_AI_PROVIDER=openai.`
    );
  }

  env.OPENAI_API_KEY = value;
}
