import { configure as serverlessExpress } from "@codegenie/serverless-express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createConfiguredApp } from "./runtime/createConfiguredApp.js";
import { loadOpenAiKeyFromSsm } from "./runtime/loadOpenAiKeyFromSsm.js";

type ServerlessHandler = ReturnType<typeof serverlessExpress>;

// One-time async cold-start init: resolve the OpenAI key from SSM (when
// ASK_AI_PROVIDER=openai) before building the app, so the shared config sees
// the key exactly as local dev does. Redeploys never touch the secret.
const init: Promise<ServerlessHandler> = (async () => {
  await loadOpenAiKeyFromSsm(process.env);
  const backendDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(backendDir, "../../..");
  const runtime = createConfiguredApp(repoRoot, process.env);
  return serverlessExpress({ app: runtime.app });
})();

export const handler = async (
  ...args: Parameters<ServerlessHandler>
): Promise<ReturnType<ServerlessHandler>> => {
  const configured = await init;
  return configured(...args);
};
