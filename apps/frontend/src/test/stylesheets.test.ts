// @vitest-environment node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { transformSync } from "esbuild";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

// The seven stylesheets the app ships. A stray `};` once survived for months because it only
// showed up as two warnings in the production build's CSS minifier; this reads every sheet the
// way the build does and fails on the first warning.
const STYLESHEETS = [
  "src/index.css",
  "src/lib/theme/glows.css",
  "src/styles/ambience.css",
  "src/styles/flow.css",
  "src/styles/shell.css",
  "src/styles/tailwind-base.css",
  "src/styles/tokens.css"
];

function cssFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFilesUnder(path);
    return name.endsWith(".css") ? [relative(process.cwd(), path)] : [];
  });
}

describe("Frontend - Stylesheets", () => {
  it("covers every stylesheet under src", () => {
    expect(cssFilesUnder(resolve(process.cwd(), "src")).sort()).toEqual(STYLESHEETS);
  });

  for (const file of STYLESHEETS) {
    it(`parses ${file} without a syntax error or a minifier warning`, () => {
      const css = readFileSync(resolve(process.cwd(), file), "utf8");

      expect(() => postcss.parse(css, { from: file })).not.toThrow();

      const result = transformSync(css, { loader: "css", minify: true });
      expect(result.warnings.map((warning) => `${file}:${warning.location?.line}: ${warning.text}`)).toEqual([]);
    });
  }
});
