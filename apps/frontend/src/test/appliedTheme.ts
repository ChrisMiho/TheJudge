import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const tokensCss = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");

function hexToTriple(hex: string): string {
  const value = hex.trim().replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)).join(" ");
}

/**
 * The accent token the document root currently resolves, as an "R G B" triple (the form
 * `palettes.ts` stores): an inline override (a custom Colorless colour) wins; otherwise the
 * value comes from the active `[data-profile]` block of the one token source, `tokens.css`.
 */
export function appliedAccentTriple(name: "--accent" | "--accent-strong" | "--accent-soft" | "--accent-contrast"): string {
  const root = document.documentElement;
  const inline = root.style.getPropertyValue(name);
  if (inline) return hexToTriple(inline);
  const profile = root.getAttribute("data-profile") ?? "blue";
  const marker = `[data-profile="${profile}"] {`;
  const start = tokensCss.indexOf(marker);
  const block = tokensCss.slice(start, tokensCss.indexOf("}", start));
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block);
  return match ? hexToTriple(match[1]) : "";
}
