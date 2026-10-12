// Registers a resolve hook so Node's built-in type stripping can load the backend's .ts sources,
// whose relative imports use ".js" specifiers: "./x.js" resolves to "./x.ts" when that file exists.
// Measurement-only; no tsx and no node_modules needed for the modules measure-follow-up.mjs loads.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && specifier.endsWith(".js") && context.parentURL) {
    const tsUrl = new URL(specifier.slice(0, -3) + ".ts", context.parentURL);
    if (existsSync(fileURLToPath(tsUrl))) return next(tsUrl.href, context);
  }
  return next(specifier, context);
}`)
);
