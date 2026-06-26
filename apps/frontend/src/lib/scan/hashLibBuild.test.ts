import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applySkiplistOutcome,
  backoffDelayMs,
  classifyFetchFailure,
  diffMissingEntries,
  evaluateBudget,
  evaluateScanPrintingInclusion,
  listScanCoverageEntries,
  mergeEntries,
  parseRetryAfterMs,
  planTargetEntryIds,
  readSkiplist,
  resolveBuildTargets,
  serializeSkiplist,
  shouldIncludeScanPrinting,
  summarizeScanCoverage,
  writeFileAtomic
} from "./hashLibBuild";

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "hashlibbuild-test-"));
  tmpDirs.push(dir);
  return dir;
}

function hash(byte: number): Uint8Array {
  return new Uint8Array(96).fill(byte);
}

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("planTargetEntryIds", () => {
  it("returns distinct, deduped ids in stable lexicographic order", () => {
    const ids = planTargetEntryIds(
      [
        { id: "z-card", hasBack: true },
        { id: "a-card", hasBack: false },
        { id: "m-card", hasBack: true },
        { id: "z-card", hasBack: true },
        { id: "_card_back", hasBack: true }
      ],
      { hasCardBackReference: true }
    );

    expect(ids).toEqual(["_card_back", "_card_back__back", "a-card", "m-card", "m-card__back", "z-card", "z-card__back"]);
  });

  it("omits back ids when hasBack is false and toggles the card back reference", () => {
    expect(planTargetEntryIds([{ id: "front-only", hasBack: false }])).toEqual(["front-only"]);
    expect(planTargetEntryIds([{ id: "front-only", hasBack: false }], { hasCardBackReference: true })).toEqual([
      "_card_back",
      "front-only"
    ]);
  });
});

describe("diffMissingEntries", () => {
  it("subtracts existing and parked ids while preserving target order", () => {
    const missing = diffMissingEntries(["b", "a", "c", "d"], ["a"], ["c"]);
    expect(missing).toEqual(["b", "d"]);
  });

  it("re-includes parked ids when retryParked is true", () => {
    const missing = diffMissingEntries(["b", "a", "c", "d"], ["a"], ["c"], { retryParked: true });
    expect(missing).toEqual(["b", "c", "d"]);
  });
});

describe("evaluateScanPrintingInclusion / shouldIncludeScanPrinting", () => {
  function scanCard(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: "paper-gameplay-printing",
      games: ["paper"],
      digital: false,
      oversized: false,
      layout: "normal",
      set_type: "expansion",
      name: "Alt-Art Test Card",
      type_line: "Legendary Creature",
      oracle_text: "Flying",
      lang: "en",
      illustration_id: "shared-art",
      ...overrides
    };
  }

  it("includes paper gameplay non-English alt-art-style printings from Default Cards", () => {
    const card = scanCard({
      id: "jp-alt-art-printing",
      lang: "ja",
      illustration_id: "non-english-only-alt-art"
    });

    expect(evaluateScanPrintingInclusion(card)).toEqual({ included: true, reason: "included" });
    expect(shouldIncludeScanPrinting(card)).toBe(true);
  });

  it.each([
    [scanCard({ id: "digital-only", games: ["arena"], digital: true }), "digital"],
    [scanCard({ id: "not-paper", games: ["mtgo"] }), "non-paper"],
    [scanCard({ id: "oversized", oversized: true }), "oversized"],
    [scanCard({ id: "art-series", layout: "art_series" }), "excluded-layout"],
    [scanCard({ id: "memorabilia-card", set_type: "memorabilia" }), "excluded-set-type"],
    [scanCard({ id: "checklist-card", oracle_text: "This is a checklist card." }), "checklist-or-substitute"],
    [scanCard({ id: "card-placeholder", type_line: "Card" }), "card-placeholder"]
  ])("excludes non-gameplay scan objects with reason %s", (card, reason) => {
    expect(evaluateScanPrintingInclusion(card).reason).toBe(reason);
    expect(shouldIncludeScanPrinting(card)).toBe(false);
  });
});

describe("summarizeScanCoverage", () => {
  it("counts target, fingerprinted, missing, and parked entries separately", () => {
    const summary = summarizeScanCoverage(["a", "b", "c", "d"], ["a", "stale-id"], {
      b: { attempts: 3, parked: true, lastError: "404" },
      c: { attempts: 1, parked: false, lastError: "503" }
    });

    expect(summary).toEqual({
      targetCount: 4,
      fingerprintedTargetCount: 1,
      missingCount: 2,
      parkedCount: 1,
      corpusStatus: "partial"
    });
  });

  it("marks coverage full only when every target is fingerprinted", () => {
    expect(summarizeScanCoverage(["a", "b"], ["a", "b"], {})).toEqual({
      targetCount: 2,
      fingerprintedTargetCount: 2,
      missingCount: 0,
      parkedCount: 0,
      corpusStatus: "full"
    });
  });
});

describe("listScanCoverageEntries", () => {
  it("reports per-entry fingerprint status and skip-list details", () => {
    const entries = listScanCoverageEntries(["front", "parked", "missing"], ["front"], {
      parked: { attempts: 3, parked: true, lastError: "404" },
      missing: { attempts: 1, parked: false, lastError: "503" }
    });

    expect(entries).toEqual([
      { id: "front", status: "fingerprinted", skiplistEntry: null },
      { id: "parked", status: "parked", skiplistEntry: { attempts: 3, parked: true, lastError: "404" } },
      { id: "missing", status: "missing", skiplistEntry: { attempts: 1, parked: false, lastError: "503" } }
    ]);
  });
});

describe("mergeEntries", () => {
  it("keeps existing entries first, existing wins collisions, and appends only new ids", () => {
    const existing = [
      { id: "keep", hash: hash(1) },
      { id: "collision", hash: hash(2) }
    ];
    const merged = mergeEntries(existing, [
      { id: "collision", hash: hash(9) },
      { id: "new", hash: hash(3) },
      { id: "new", hash: hash(4) }
    ]);

    expect(merged.map((entry) => entry.id)).toEqual(["keep", "collision", "new"]);
    expect(merged[1].hash[0]).toBe(2);
    expect(merged[2].hash[0]).toBe(3);
  });
});

describe("evaluateBudget", () => {
  it("stops after exactly the configured per-run limit", () => {
    const budget = { limit: 3, startedAtMs: 1_000 };

    expect(evaluateBudget({ hashedNew: 2 }, budget, 1_000)).toEqual({ stop: false, reason: null });
    expect(evaluateBudget({ hashedNew: 3 }, budget, 1_000)).toEqual({ stop: true, reason: "limit" });
    expect(evaluateBudget({ hashedNew: 4 }, budget, 1_000)).toEqual({ stop: true, reason: "limit" });
  });

  it("stops when maxMinutes has elapsed", () => {
    const budget = { maxMinutes: 2, startedAtMs: 1_000 };

    expect(evaluateBudget({ hashedNew: 1 }, budget, 120_999)).toEqual({ stop: false, reason: null });
    expect(evaluateBudget({ hashedNew: 1 }, budget, 121_000)).toEqual({ stop: true, reason: "max-minutes" });
  });

  it("prefers limit when both budgets are set and the limit is reached first", () => {
    const budget = { limit: 2, maxMinutes: 10, startedAtMs: 1_000 };

    expect(evaluateBudget({ hashedNew: 2 }, budget, 60_000)).toEqual({ stop: true, reason: "limit" });
  });

  it("prefers maxMinutes when both budgets are set and time is reached first", () => {
    const budget = { limit: 5, maxMinutes: 1, startedAtMs: 1_000 };

    expect(evaluateBudget({ hashedNew: 1 }, budget, 61_000)).toEqual({ stop: true, reason: "max-minutes" });
  });

  it("does not stop when neither budget is set", () => {
    expect(evaluateBudget({ hashedNew: 1_000 }, { startedAtMs: 1_000 }, 999_999)).toEqual({ stop: false, reason: null });
  });
});

describe("writeFileAtomic", () => {
  it("writes bytes, overwrites existing files, and leaves no temp sibling", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "nested", "artifact.bin");

    writeFileAtomic(filePath, new Uint8Array([1, 2, 3]));
    expect(Array.from(readFileSync(filePath))).toEqual([1, 2, 3]);

    writeFileSync(filePath, "old");
    writeFileAtomic(filePath, "new");

    expect(readFileSync(filePath, "utf8")).toBe("new");
    expect(readdirSync(join(dir, "nested")).filter((name) => name.includes(".tmp-"))).toEqual([]);
  });
});

describe("applySkiplistOutcome", () => {
  it("bumps attempts on a permanent outcome without mutating the input", () => {
    const skiplist = {};
    const next = applySkiplistOutcome(skiplist, "a", "permanent", { parkThreshold: 3, error: "404" });

    expect(skiplist).toEqual({});
    expect(next).toEqual({ a: { attempts: 1, parked: false, lastError: "404" } });
  });

  it("parks an entry once attempts reach parkThreshold", () => {
    let skiplist = {};
    skiplist = applySkiplistOutcome(skiplist, "a", "permanent", { parkThreshold: 2, error: "404" });
    skiplist = applySkiplistOutcome(skiplist, "a", "permanent", { parkThreshold: 2, error: "404" });

    expect(skiplist).toEqual({ a: { attempts: 2, parked: true, lastError: "404" } });
  });

  it("clears an id's entry on a success outcome", () => {
    let skiplist = applySkiplistOutcome({}, "a", "permanent", { parkThreshold: 3, error: "404" });
    skiplist = applySkiplistOutcome(skiplist, "a", "success", { parkThreshold: 3 });

    expect(skiplist).toEqual({});
  });

  it("leaves unrelated ids untouched", () => {
    const skiplist = { b: { attempts: 1, parked: false, lastError: null } };
    const next = applySkiplistOutcome(skiplist, "a", "permanent", { parkThreshold: 3 });

    expect(next.b).toEqual(skiplist.b);
    expect(next.a).toEqual({ attempts: 1, parked: false, lastError: null });
  });
});

describe("readSkiplist / serializeSkiplist", () => {
  it("returns an empty map when the sidecar file does not exist", () => {
    const dir = makeTmpDir();
    expect(readSkiplist(join(dir, "missing.json"))).toEqual({});
  });

  it("round-trips through serializeSkiplist and writeFileAtomic", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "cardhashSkiplist.json");
    const skiplist = {
      a: { attempts: 2, parked: false, lastError: "503" },
      b: { attempts: 3, parked: true, lastError: "404" }
    };

    writeFileAtomic(filePath, serializeSkiplist(skiplist));

    expect(readSkiplist(filePath)).toEqual(skiplist);
  });

  it("normalizes malformed entries instead of throwing", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "malformed.json");
    writeFileSync(filePath, JSON.stringify({ a: { parked: "yes" }, b: "not-an-object" }));

    expect(readSkiplist(filePath)).toEqual({ a: { attempts: 0, parked: true, lastError: null } });
  });
});

describe("classifyFetchFailure", () => {
  it("classifies rate limits, server errors, and network errors as transient", () => {
    expect(classifyFetchFailure(429)).toBe("transient");
    expect(classifyFetchFailure(503)).toBe("transient");
    expect(classifyFetchFailure(500)).toBe("transient");
    expect(classifyFetchFailure(null, new Error("socket hang up"))).toBe("transient");
  });

  it("classifies client errors and decode/dimension failures as permanent", () => {
    expect(classifyFetchFailure(404)).toBe("permanent");
    expect(classifyFetchFailure(400)).toBe("permanent");
    expect(classifyFetchFailure(null, new Error("Expected canonical 488x680 PNG"))).toBe("permanent");
    expect(classifyFetchFailure(undefined, new Error("decode failed"))).toBe("permanent");
  });
});

describe("backoffDelayMs", () => {
  it("honors positive retry-after values and caps them", () => {
    expect(backoffDelayMs(1, 1200)).toBe(1200);
    expect(backoffDelayMs(1, 60_000)).toBe(30_000);
  });

  it("uses bounded exponential growth", () => {
    expect(backoffDelayMs(1)).toBe(500);
    expect(backoffDelayMs(3)).toBe(2_000);
    expect(backoffDelayMs(20)).toBe(30_000);
    expect(backoffDelayMs(0)).toBe(500);
  });
});

describe("parseRetryAfterMs", () => {
  it("parses integer seconds as milliseconds", () => {
    expect(parseRetryAfterMs("3")).toBe(3_000);
  });

  it("parses HTTP dates relative to now and rejects invalid values", () => {
    expect(parseRetryAfterMs("Wed, 21 Oct 2015 07:28:00 GMT", Date.parse("Wed, 21 Oct 2015 07:27:58 GMT"))).toBe(2_000);
    expect(parseRetryAfterMs("not a retry-after")).toBeNull();
  });
});

describe("resolveBuildTargets", () => {
  it("routes --fresh to sibling fresh artifacts and ignores existing live ids", () => {
    const targets = resolveBuildTargets({
      output: "/repo/apps/frontend/public/data/cardhashes.bin",
      manifest: "/repo/apps/frontend/public/data/cardhashManifest.json",
      fresh: true,
      force: false,
      outputExplicit: false,
      manifestExplicit: false,
      exists: () => false
    });

    expect(targets.output).toBe("/repo/apps/frontend/public/data/cardhashes.fresh.bin");
    expect(targets.manifest).toBe("/repo/apps/frontend/public/data/cardhashManifest.fresh.json");
    expect(targets.readExistingOutput).toBe(false);
  });

  it("refuses to clobber the default --fresh target unless forced or explicitly chosen", () => {
    expect(() =>
      resolveBuildTargets({
        output: "/repo/apps/frontend/public/data/cardhashes.bin",
        manifest: "/repo/apps/frontend/public/data/cardhashManifest.json",
        fresh: true,
        force: false,
        outputExplicit: false,
        manifestExplicit: false,
        exists: (filePath) => filePath.endsWith("cardhashes.fresh.bin")
      })
    ).toThrow(/--fresh target already exists/);

    expect(
      resolveBuildTargets({
        output: "/repo/apps/frontend/public/data/cardhashes.bin",
        manifest: "/repo/apps/frontend/public/data/cardhashManifest.json",
        fresh: true,
        force: true,
        outputExplicit: false,
        manifestExplicit: false,
        exists: () => true
      }).output
    ).toBe("/repo/apps/frontend/public/data/cardhashes.fresh.bin");

    expect(
      resolveBuildTargets({
        output: "/tmp/operator-chosen.bin",
        manifest: "/repo/apps/frontend/public/data/cardhashManifest.json",
        fresh: true,
        force: false,
        outputExplicit: true,
        manifestExplicit: false,
        exists: () => true
      }).manifest
    ).toBe("/tmp/operator-chosen.manifest.json");
  });
});
