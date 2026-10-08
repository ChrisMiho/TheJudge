// Writes JSON formatted with the repo's own Prettier config, so a committed file
// a command rewrites (a case file, the gate baseline, the frozen vectors) passes
// `npm run format:check` without a separate formatting step.

import { writeFile } from "node:fs/promises";

/** Returns the number of characters written. */
export async function writeFormattedJson(filePath, value) {
  const prettier = await import("prettier");
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  const text = await prettier.format(`${JSON.stringify(value, null, 2)}\n`, { ...config, filepath: filePath });
  await writeFile(filePath, text, "utf8");
  return text.length;
}
