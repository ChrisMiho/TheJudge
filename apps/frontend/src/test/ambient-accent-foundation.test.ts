import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const contractStart = "/* Ambient accent surface contract */";
const contractEnd = "/* End ambient accent surface contract */";

function cssBlock(startMarker: string): string {
  const start = appCss.indexOf(startMarker);
  if (start === -1) return "";

  const openingBrace = appCss.indexOf("{", start);
  let depth = 0;

  for (let index = openingBrace; index < appCss.length; index += 1) {
    if (appCss[index] === "{") depth += 1;
    if (appCss[index] === "}") depth -= 1;
    if (depth === 0) return appCss.slice(start, index + 1);
  }

  return "";
}

function ambientContract(): string {
  const start = appCss.indexOf(contractStart);
  const end = appCss.indexOf(contractEnd);

  if (start === -1 || end === -1) return "";
  return appCss.slice(start, end + contractEnd.length);
}

describe("ambient accent surface CSS contract", () => {
  it("defines centralized resting, interactive, and current treatments", () => {
    const contract = ambientContract();

    expect(contract).not.toBe("");
    expect(cssBlock(".ambient-accent-surface")).toMatch(
      /border-color:\s*rgb\(var\(--accent\)\s*\/\s*0\.\d+\)/
    );
    expect(contract).toContain(".ambient-accent-interactive:not(:disabled):hover");
    expect(contract).toContain(".ambient-accent-interactive:focus-visible");
    expect(contract).toContain(".ambient-accent-interactive:focus-within");
    expect(contract).toContain(".ambient-accent-interactive:not(:disabled):active");
    expect(contract).toContain('.ambient-accent-surface[data-accent-current="true"]');

    const reducedMotion = cssBlock("@media (prefers-reduced-motion: reduce)");
    const outsideContract = appCss.replace(contract, "").replace(reducedMotion, "");
    expect(outsideContract).not.toContain(".ambient-accent-surface");
    expect(outsideContract).not.toContain(".ambient-accent-interactive");
    expect(outsideContract).not.toContain("[data-accent-current");
  });

  it("uses only the existing palette and motion tokens", () => {
    const contract = ambientContract();
    const referencedAccentTokens = [
      ...contract.matchAll(/var\((--accent(?:-[a-z]+)?)\)/g)
    ].map((match) => match[1]);

    expect(new Set(referencedAccentTokens)).toEqual(
      new Set(["--accent", "--accent-strong", "--accent-soft"])
    );
    expect(contract).toContain("var(--motion-base)");
    expect(contract).toContain("var(--motion-ease-out)");

    const declaredAccentTokens = [
      ...appCss.matchAll(/^\s*(--accent(?:-[a-z]+)?):/gm)
    ].map((match) => match[1]);
    expect(declaredAccentTokens).toEqual([
      "--accent",
      "--accent-strong",
      "--accent-soft",
      "--accent-contrast"
    ]);
  });

  it("keeps neutral and independently themed surfaces outside the contract", () => {
    const contract = ambientContract();

    for (const selector of [
      "body",
      ".page-shell",
      ".card-identity-ring",
      ".scan-video",
      ".scan-confirm-popup",
      ".send-spinner"
    ]) {
      expect(contract).not.toContain(selector);
    }

    expect(cssBlock("body")).not.toContain("--accent");
    expect(cssBlock(".page-shell")).not.toContain("--accent");
    expect(cssBlock(".card-identity-ring::before")).toContain(
      "background: var(--card-identity-ring"
    );
  });
});
