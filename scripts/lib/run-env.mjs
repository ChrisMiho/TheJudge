// The environment an answer-quality run sees, shared by the eval command and the rule-search tools.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadLocalOpenAiEnv } from "./local-openai-env.mjs";
import { DEFAULT_EMBEDDING_PROVIDER } from "./prompt-fidelity.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * The environment a run sees: the process environment, filled in from the
 * local env files the way `npm run openai:verify-credentials` already does
 * (`scripts/lib/local-openai-env.mjs`; the process environment always wins),
 * so the owner runs the command with nothing exported by hand.
 *
 * `--confirm-live-calls` is the explicit consent to a live provider, so when
 * that flag is present, a key is available, and `ASK_AI_PROVIDER` is unset,
 * the run selects `openai`. It never overrides a value that is set: an
 * explicit `ASK_AI_PROVIDER=mock` still refuses, through the same guard, and
 * the mock-first default for everything that is not this command is untouched
 * (an unconfirmed run leaves `ASK_AI_PROVIDER` exactly as it found it).
 */
export const NO_LOCAL_ENV_VARIABLE = "ANSWER_QUALITY_NO_LOCAL_ENV";

/**
 * Setting `ANSWER_QUALITY_NO_LOCAL_ENV=1` skips the local env files entirely,
 * so a run sees only the process environment: no key can be filled in from a
 * file, and an offline dry run can promise it builds no client. Anything that
 * must stay free of a provider -- a verification, a build session -- sets it.
 */
export function resolveRunEnv({ processEnv, confirmed, loadLocalEnv = loadLocalOpenAiEnv }) {
  const skipLocalFiles = ["1", "true", "yes"].includes(String(processEnv?.[NO_LOCAL_ENV_VARIABLE] ?? "").trim().toLowerCase());
  const { env, sources } = skipLocalFiles ? { env: { ...processEnv }, sources: [] } : loadLocalEnv({ repoRoot, env: processEnv });
  const hasKey = Boolean(env.OPENAI_API_KEY?.trim());
  const providerUnset = !env.ASK_AI_PROVIDER || env.ASK_AI_PROVIDER.trim() === "";
  const resolved = { ...env };
  if (confirmed && hasKey && providerUnset) resolved.ASK_AI_PROVIDER = "openai";
  // The deployed app embeds every question with the bundled local model
  // (REQ-184), so that is this run's default too: the instrument measures
  // the retrieval players get, unless the owner explicitly asks otherwise.
  if (!resolved.EMBEDDING_PROVIDER || resolved.EMBEDDING_PROVIDER.trim() === "")
    resolved.EMBEDDING_PROVIDER = DEFAULT_EMBEDDING_PROVIDER;
  Object.defineProperty(resolved, "__localEnvSources", { value: sources, enumerable: false });
  return resolved;
}
