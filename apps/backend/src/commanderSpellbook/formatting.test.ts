import { describe, expect, it } from "vitest";
import type { ComboVariant } from "./catalog.js";
import { COMBO_SECTION_HEADING, formatComboSection } from "./formatting.js";
import type { ComboCandidate, ComboIngredientAnnotation } from "./matcher.js";

/** The exact assertion slice D's acceptance criterion names. */
const STANDALONE_COMPLETE = /\bcomplete\b/i;

function annotation(overrides: Partial<ComboIngredientAnnotation> = {}): ComboIngredientAnnotation {
  return {
    kind: "compatible-present",
    label: "Thassa's Oracle",
    isTemplate: false,
    quantityRequired: 1,
    quantitySatisfied: 1,
    permittedZones: ["B"],
    occupiedZones: ["B"],
    wrongZones: [],
    stateZone: "B",
    cardState: "untapped",
    mustBeCommander: false,
    matchedInstanceIds: ["battlefield-0"],
    ...overrides
  };
}

function variant(overrides: Partial<ComboVariant> = {}): ComboVariant {
  return {
    variantId: "1000-2000",
    sourceUrl: "https://commanderspellbook.com/combo/1000-2000/",
    popularity: 900,
    steps: "Cast the spell.\nWin the game.",
    manaNeeded: "{U}{B}",
    easyPrerequisites: "All permanents are untapped.",
    notablePrerequisites: "Your library has at most five cards.",
    notes: "The trigger must still be on the stack.",
    producedEffects: ["Win the game"],
    cardIngredients: [],
    templateIngredients: [],
    ...overrides
  };
}

function candidate(overrides: Partial<ComboCandidate> = {}): ComboCandidate {
  return {
    variant: variant(),
    fullyAssigned: true,
    annotations: [annotation()],
    missingCount: 0,
    compatibleZoneCount: 1,
    anchorCoverage: 0,
    attachedCardCoverage: 1,
    ...overrides
  };
}

describe("Backend - Ask AI", () => {
  describe("Combo section rendering", () => {
    it("renders no section and no heading for zero candidates", () => {
      expect(formatComboSection([])).toBe("");
    });

    it("labels the section community-sourced", () => {
      const section = formatComboSection([candidate()]);
      expect(section).toContain(COMBO_SECTION_HEADING);
      expect(section).toContain("COMMUNITY-SOURCED");
    });

    it("never emits the standalone word complete for a fully assigned candidate", () => {
      const section = formatComboSection([candidate({ fullyAssigned: true })]);
      expect(section).not.toMatch(STANDALONE_COMPLETE);
    });

    it("never emits the standalone word complete for any candidate mix", () => {
      const section = formatComboSection([
        candidate({ fullyAssigned: true }),
        candidate({
          fullyAssigned: false,
          missingCount: 1,
          annotations: [
            annotation(),
            annotation({ kind: "missing-exact", label: "Demonic Consultation", quantitySatisfied: 0, occupiedZones: [] }),
            annotation({ kind: "wrong-zone", label: "Underworld Breach", quantitySatisfied: 0, occupiedZones: [], wrongZones: ["graveyard"] }),
            annotation({ kind: "unresolved-template", label: "A sacrifice outlet", isTemplate: true, quantitySatisfied: 0, occupiedZones: [] }),
            annotation({ kind: "matched-template", label: "An untapper", isTemplate: true })
          ]
        })
      ]);

      expect(section).not.toMatch(STANDALONE_COMPLETE);
    });

    it("renders a fully assigned candidate as all pieces present with state unverified", () => {
      const section = formatComboSection([candidate({ fullyAssigned: true })]);
      expect(section).toContain("all pieces present; card state unverified");
    });

    it("names every missing and wrongly zoned ingredient on a partial candidate", () => {
      const section = formatComboSection([
        candidate({
          fullyAssigned: false,
          missingCount: 2,
          annotations: [
            annotation({ kind: "missing-exact", label: "Demonic Consultation", quantitySatisfied: 0, occupiedZones: [] }),
            annotation({
              kind: "wrong-zone",
              label: "Underworld Breach",
              quantitySatisfied: 0,
              occupiedZones: [],
              wrongZones: ["graveyard"],
              permittedZones: ["B"]
            })
          ]
        })
      ]);

      expect(section).toContain("partial; missing pieces named below");
      expect(section).toContain("Demonic Consultation — MISSING (1 needed)");
      expect(section).toContain("Underworld Breach — INCORRECTLY ZONED: submitted in graveyard");
      expect(section).toContain("needs it in battlefield");
    });

    it("renders per-ingredient card state and mustBeCommander for present, wrong-zone, and missing", () => {
      const section = formatComboSection([
        candidate({
          fullyAssigned: false,
          annotations: [
            annotation({ cardState: "untapped", mustBeCommander: true }),
            annotation({
              kind: "wrong-zone",
              label: "Wrongly Zoned",
              quantitySatisfied: 0,
              occupiedZones: [],
              // Needs exile, was submitted in the graveyard, so the expected
              // zone's state is what gets reported.
              permittedZones: ["E"],
              wrongZones: ["graveyard"],
              stateZone: "E",
              cardState: "with a counter",
              mustBeCommander: false
            }),
            annotation({
              kind: "missing-exact",
              label: "Absent Card",
              quantitySatisfied: 0,
              occupiedZones: [],
              cardState: "in the graveyard with three others",
              stateZone: "G",
              permittedZones: ["G"],
              mustBeCommander: true
            })
          ]
        })
      ]);

      expect(section).toContain("required state (battlefield): untapped");
      expect(section).toContain("required state (exile): with a counter");
      expect(section).toContain("required state (graveyard): in the graveyard with three others");
      expect(section.match(/must be commander: yes/g)).toHaveLength(2);
      expect(section).toContain("must be commander: no");
    });

    it("marks an unresolved template as unmatchable automatically", () => {
      const section = formatComboSection([
        candidate({
          fullyAssigned: false,
          annotations: [
            annotation({
              kind: "unresolved-template",
              label: "A free sacrifice outlet",
              isTemplate: true,
              quantitySatisfied: 0,
              occupiedZones: []
            })
          ]
        })
      ]);

      expect(section).toContain("A free sacrifice outlet [template] — UNRESOLVED");
      expect(section).toContain("no authoritative card list");
    });

    it("carries the stable Commander Spellbook reference and the variant's editorial fields", () => {
      const section = formatComboSection([candidate()]);

      expect(section).toContain("https://commanderspellbook.com/combo/1000-2000/");
      expect(section).toContain("produces: Win the game");
      expect(section).toContain("mana needed: {U}{B}");
      expect(section).toContain("easy prerequisites: All permanents are untapped.");
      expect(section).toContain("notable prerequisites: Your library has at most five cards.");
      expect(section).toContain("Cast the spell.");
      expect(section).toContain("notes: The trigger must still be on the stack.");
    });

    it("renders a quantity marker only when more than one is required", () => {
      const single = formatComboSection([candidate()]);
      expect(single).not.toContain("x1");

      const double = formatComboSection([
        candidate({ annotations: [annotation({ label: "Basalt Monolith", quantityRequired: 2, quantitySatisfied: 2 })] })
      ]);
      expect(double).toContain("Basalt Monolith x2");
    });

    it("includes all five guardrail instructions", () => {
      const section = formatComboSection([candidate()]);

      expect(section).toContain("community-maintained catalog data from Commander Spellbook");
      expect(section).toContain("not legality validation");
      expect(section).toContain("Comprehensive Rules remain authoritative");
      expect(section).toContain("identify the missing or incorrectly zoned pieces");
      expect(section).toContain("do not expand it into a survey of unrelated staples");
      expect(section).toContain("check each ingredient's applicable card state");
      expect(section).toContain("must-be-commander requirement against the submitted board");
    });

    it("numbers candidates in the order supplied", () => {
      const section = formatComboSection([
        candidate({ variant: variant({ variantId: "first", sourceUrl: "https://example.test/first" }) }),
        candidate({ variant: variant({ variantId: "second", sourceUrl: "https://example.test/second" }) })
      ]);

      expect(section.indexOf("1. ")).toBeLessThan(section.indexOf("2. "));
      expect(section.indexOf("https://example.test/first")).toBeLessThan(section.indexOf("https://example.test/second"));
    });
  });
});
