import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAskAiRequest } from "../test-utils/requestBuilders.js";

const accessedPaths = vi.hoisted(() => [] as string[]);

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    default: actual,
    existsSync: (path: Parameters<typeof actual.existsSync>[0]) => {
      accessedPaths.push(String(path));
      return actual.existsSync(path);
    },
    readFileSync: ((path: string, ...rest: unknown[]) => {
      accessedPaths.push(String(path));
      return (actual.readFileSync as (...args: unknown[]) => unknown)(path, ...rest);
    }) as unknown as typeof actual.readFileSync
  };
});

const { createConfiguredApp } = await import("./createConfiguredApp.js");

const sampleVariant = {
  variantId: "1000-2000",
  sourceUrl: "https://commanderspellbook.com/combo/1000-2000/",
  popularity: 900,
  steps: "Cast the spell, then win.",
  manaNeeded: "{U}{B}",
  easyPrerequisites: "",
  notablePrerequisites: "",
  notes: "",
  producedEffects: ["Win the game"],
  cardIngredients: [
    { cardId: "oracle-1", cardName: "Thassa's Oracle", quantity: 1, zones: ["B"], cardState: {}, mustBeCommander: false }
  ],
  templateIngredients: []
};

let repoRoot: string;
let warnSpy: ReturnType<typeof vi.spyOn>;

function comboPaths(root: string) {
  return {
    detail: join(root, "apps/backend/data/commanderSpellbookCombos.json"),
    index: join(root, "apps/backend/data/commanderSpellbookComboIndex.json")
  };
}

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  repoRoot = mkdtempSync(join(tmpdir(), "combo-runtime-"));
  mkdirSync(join(repoRoot, "apps/backend/data"), { recursive: true });
  const paths = comboPaths(repoRoot);
  writeFileSync(paths.detail, JSON.stringify({ variants: [sampleVariant] }), "utf8");
  writeFileSync(
    paths.index,
    JSON.stringify({ byOracleId: { "oracle-1": ["1000-2000"] }, byTemplateOracleId: {} }),
    "utf8"
  );
  accessedPaths.length = 0;
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("Backend - Ask AI", () => {
  describe("Combo catalog wiring", () => {
    it("loads the catalog when the flag defaults to enabled", () => {
      const runtime = createConfiguredApp(repoRoot, {});

      expect(runtime.config.comboEnrichmentEnabled).toBe(true);
      expect(runtime.comboVariantCount).toBe(1);
    });

    it("never touches either artifact when the flag is disabled", () => {
      const runtime = createConfiguredApp(repoRoot, { COMBO_ENRICHMENT_ENABLED: "false" });
      const paths = comboPaths(repoRoot);

      expect(runtime.comboVariantCount).toBe(0);
      expect(accessedPaths).not.toContain(paths.detail);
      expect(accessedPaths).not.toContain(paths.index);
    });

    it("builds an enabled and a disabled app in one process with no module-load latch", () => {
      const enabled = createConfiguredApp(repoRoot, {});
      const disabled = createConfiguredApp(repoRoot, { COMBO_ENRICHMENT_ENABLED: "false" });
      const enabledAgain = createConfiguredApp(repoRoot, {});

      expect(enabled.comboVariantCount).toBe(1);
      expect(disabled.comboVariantCount).toBe(0);
      expect(enabledAgain.comboVariantCount).toBe(1);
    });

    it("keeps ask-ai request and response bodies byte-identical with the flag on and off", async () => {
      const enabled = createConfiguredApp(repoRoot, {});
      const disabled = createConfiguredApp(repoRoot, { COMBO_ENRICHMENT_ENABLED: "false" });
      // No submitted card matches the catalog's ingredient, so neither leg gets a
      // combo section and the payloads must be indistinguishable.
      const payload = createAskAiRequest();

      const enabledResponse = await request(enabled.app).post("/api/ask-ai").send(payload);
      const disabledResponse = await request(disabled.app).post("/api/ask-ai").send(payload);

      expect(enabledResponse.status).toBe(disabledResponse.status);
      expect(Object.keys(enabledResponse.body).sort()).toEqual(Object.keys(disabledResponse.body).sort());
      expect(JSON.stringify(enabledResponse.body)).toBe(JSON.stringify(disabledResponse.body));
    });

    it("fails open and still answers when the artifacts are missing entirely", async () => {
      const emptyRoot = mkdtempSync(join(tmpdir(), "combo-runtime-empty-"));
      const runtime = createConfiguredApp(emptyRoot, {});

      expect(runtime.comboVariantCount).toBe(0);

      const response = await request(runtime.app).post("/api/ask-ai").send(createAskAiRequest());
      expect(response.status).toBe(200);
      expect(typeof response.body.answer).toBe("string");
    });
  });
});
