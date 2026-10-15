import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// jsdom does no layout, so these read `shell.css` as text (REQ-207, REQ-113).
const css = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf8");

/** The body of the first rule whose selector line is exactly `selector`, at or after `from`. */
function ruleAt(selector: string, from = 0): { body: string; index: number } {
  const index = css.indexOf(`${selector} {`, from);
  expect(index, `rule "${selector}" exists`).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", index);
  return { body: css.slice(open + 1, css.indexOf("}", open)), index };
}

function mediaBlock(query: string): { text: string; index: number } {
  const index = css.indexOf(`@media (${query}) {`);
  expect(index, `@media (${query}) exists`).toBeGreaterThanOrEqual(0);
  const open = css.indexOf("{", index);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") depth -= 1;
    if (depth === 0) return { text: css.slice(index, i + 1), index };
  }
  throw new Error("unclosed @media");
}

describe("REQ-207 menu button look", () => {
  const phone = ruleAt(".app-header .menu-toggle", css.indexOf("the ☰ (round 8"));
  const desktopBlock = mediaBlock("min-width: 768px");
  const hoverIndex = css.indexOf(".menu-toggle:hover,");

  it("B1: desktop draws 45px bars with the glow, inside the 768px block and before the hover/focus rule", () => {
    const block = mediaBlock("min-width: 768px");
    const bars = block.text.slice(block.text.indexOf(".app-header .menu-toggle::before"));
    expect(bars).toMatch(/width:\s*45px/);
    expect(bars).toMatch(/2\.5px/);
    expect(bars).toMatch(/9\.5px/);
    expect(bars).toMatch(/19px/);
    expect(bars).toMatch(/drop-shadow\(0 0 6px var\(--menu-glow\)\)/);
    expect(bars).toMatch(/pointer-events:\s*none/);
    expect(desktopBlock.text).not.toMatch(/border|background:\s*color-mix/);
    expect(hoverIndex).toBeGreaterThan(desktopBlock.index + desktopBlock.text.length - 1);
    expect(desktopBlock.index).toBeLessThan(hoverIndex);
  });

  it("B2: phone keeps the 50px box and 1.4rem glyph with the glow; desktop box stays 54px", () => {
    expect(phone.body).toMatch(/min-width:\s*50px/);
    expect(phone.body).toMatch(/min-height:\s*50px/);
    expect(phone.body).toMatch(/font-size:\s*1\.4rem/);
    expect(phone.body).toMatch(/--menu-glow:\s*color-mix\(in srgb, var\(--accent\) 55%, #fff\)/);
    expect(phone.body).toMatch(/text-shadow:\s*0 0 6px var\(--menu-glow\)/);
    expect(phone.index).toBeLessThan(desktopBlock.index);

    const desktop = ruleAt(".app-header .menu-toggle", desktopBlock.index);
    expect(desktop.body).toMatch(/min-width:\s*54px/);
    expect(desktop.body).toMatch(/min-height:\s*54px/);
    expect(desktop.body).not.toMatch(/border|background/);
  });

  it("keeps the hover and focus fill off the glow (glow is on the bars and glyph only)", () => {
    const hover = css.slice(hoverIndex, css.indexOf("}", hoverIndex));
    expect(hover).not.toMatch(/shadow/);
  });
});

describe("REQ-113 open tray never scrolls sideways", () => {
  it("B3: the right-edge line is drawn inside the tray and still paints", () => {
    const line = ruleAt(".menu-tray::after").body;
    expect(line).not.toMatch(/(?:right|left):\s*-/);
    expect(line).toMatch(/content:\s*""/);
    expect(line).toMatch(/width:\s*1px/);
    expect(line).toMatch(/background:/);
  });

  it("B4: the tray declares overflow-x hidden or clip", () => {
    expect(ruleAt(".menu-tray").body).toMatch(/overflow-x:\s*(hidden|clip)/);
  });
});
