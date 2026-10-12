import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { porterStem, tokenizeSearchText } from "./gameRulesStemmer.js";

describe("REQ-233 Porter stemmer", () => {
  it("matches the published algorithm on its own examples", () => {
    const cases: Array<[string, string]> = [
      ["caresses", "caress"],
      ["ponies", "poni"],
      ["cats", "cat"],
      ["feed", "feed"],
      ["agreed", "agre"],
      ["plastered", "plaster"],
      ["motoring", "motor"],
      ["sing", "sing"],
      ["conflated", "conflat"],
      ["troubled", "troubl"],
      ["hopping", "hop"],
      ["falling", "fall"],
      ["hissing", "hiss"],
      ["filing", "file"],
      ["happy", "happi"],
      ["sky", "sky"],
      ["relational", "relat"],
      ["conditional", "condit"],
      ["digitizer", "digit"],
      ["operator", "oper"],
      ["feudalism", "feudal"],
      ["decisiveness", "decis"],
      ["hopefulness", "hope"],
      ["triplicate", "triplic"],
      ["formative", "form"],
      ["electrical", "electr"],
      ["goodness", "good"],
      ["revival", "reviv"],
      ["allowance", "allow"],
      ["inference", "infer"],
      ["adjustable", "adjust"],
      ["replacement", "replac"],
      ["adoption", "adopt"],
      ["communism", "commun"],
      ["activate", "activ"],
      ["effective", "effect"],
      ["probate", "probat"],
      ["controll", "control"]
    ];
    for (const [word, stem] of cases) expect(porterStem(word), word).toBe(stem);
  });

  it("brings the forms of a Magic verb together", () => {
    const stems = new Set(["attack", "attacks", "attacked", "attacking"].map(porterStem));
    expect(stems.size).toBe(1);
    expect(porterStem("destroy")).toBe(porterStem("destroyed"));
    expect(porterStem("creatures")).toBe(porterStem("creature"));
  });

  it("leaves words shorter than three letters alone", () => {
    expect(porterStem("is")).toBe("is");
    expect(porterStem("be")).toBe("be");
  });

  it("adds no npm dependency: the stemmer is one in-repo module", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const manifest of ["../../../package.json", "../package.json"]) {
      const pkg = JSON.parse(readFileSync(resolve(here, manifest), "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
      expect(names.filter((name) => /stem|porter|natural|snowball/i.test(name))).toEqual([]);
    }
  });
});

describe("REQ-233 tokenizer", () => {
  it("drops a trailing sentence period but keeps a rule id's dots", () => {
    expect(tokenizeSearchText("It attacks. See 514.3a and 704.5aa.")).toEqual(["attack", "see", "514.3a", "704.5aa"]);
  });

  it("keeps \"can't\" and \"it's\" whole, with straight or curly apostrophes", () => {
    expect(tokenizeSearchText("A creature can't block; it’s tapped.")).toEqual(["creatur", "can't", "block", "it's", "tap"]);
    expect(tokenizeSearchText("It doesn't untap")).toContain("doesn't");
  });

  it("cuts any other apostrophe like today (a possessive's s is dropped)", () => {
    expect(tokenizeSearchText("the player's library")).toEqual(["player", "librari"]);
  });

  it("reads U+2028 and no-break spaces as spaces", () => {
    expect(tokenizeSearchText("first strike damage")).toEqual(["first", "strike", "damag"]);
  });

  it("does not stem a token with a digit or a dot", () => {
    expect(tokenizeSearchText("613.9 614.1a 100")).toEqual(["613.9", "614.1a", "100"]);
  });

  it("drops stop words and short tokens, before and after stemming", () => {
    expect(tokenizeSearchText("What does the card do? Cards are in it")).toEqual([]);
  });
});
