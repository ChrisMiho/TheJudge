// Shared assembly for the two commands that write the offline prompt gate's
// committed files (`npm run eval:build-rules-gate-vectors` and
// `npm run eval:rules-gate:baseline`): the corpus through the shared loader,
// the production prompt resources, and Prettier-formatted JSON output so a
// written file passes `format:check`. TypeScript imports stay inside function
// bodies, so importing this module never needs tsx.

import { writeFile } from "node:fs/promises";

import { loadGoldCases } from "./gold-cases.mjs";
import { buildCaseRequest, loadPromptResources } from "./prompt-fidelity.mjs";

/** Every non-rejected case, the way the gate runs them. */
export async function loadGateCases() {
  const cases = await loadGoldCases();
  return cases.filter((caseEntry) => caseEntry.review.status !== "rejected");
}

/** The In-Depth / lookup request for a case, parsed by the Ask AI schema the route handler uses. */
export async function parseCaseRequest(caseEntry) {
  const { askAiRequestSchema } = await import("../../apps/backend/src/validation/askAiRequest.ts");
  const parsed = askAiRequestSchema.safeParse(buildCaseRequest(caseEntry));
  if (!parsed.success) {
    throw new Error(`${caseEntry.id}: the request built for this case is rejected by the Ask AI schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function loadGateInputs() {
  const [cases, resources] = await Promise.all([loadGateCases(), loadPromptResources()]);
  return { cases, resources, buildRequest: buildCaseRequest };
}

/** Writes JSON formatted with the repo's own Prettier config, so `format:check` stays green. */
export async function writeFormattedJson(filePath, value) {
  const prettier = await import("prettier");
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  const text = await prettier.format(`${JSON.stringify(value, null, 2)}\n`, { ...config, filepath: filePath });
  await writeFile(filePath, text, "utf8");
  return text.length;
}
