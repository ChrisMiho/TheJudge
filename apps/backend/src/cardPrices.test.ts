import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { loadCardPrintingPricesIndex } from "./cardPrices.js";

describe("loadCardPrintingPricesIndex", () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
      dir = undefined;
    }
  });

  it("returns an empty map, without throwing, when the committed file is missing", () => {
    const index = loadCardPrintingPricesIndex("/nonexistent/cardPrintingPricesByOracleId.json.gz");
    expect(index.size).toBe(0);
  });

  it("returns an empty map, without throwing, when the committed file is not valid gzip/JSON", () => {
    dir = mkdtempSync(join(tmpdir(), "card-prices-test-"));
    const filePath = join(dir, "cardPrintingPricesByOracleId.json.gz");
    writeFileSync(filePath, "not gzip at all");

    const index = loadCardPrintingPricesIndex(filePath);
    expect(index.size).toBe(0);
  });

  it("loads a well-formed committed artifact into a Map keyed by oracle id, copying snapshotDate onto each entry", () => {
    dir = mkdtempSync(join(tmpdir(), "card-prices-test-"));
    const filePath = join(dir, "cardPrintingPricesByOracleId.json.gz");
    const artifact = {
      snapshotDate: "2026-09-08T00:00:00.000Z",
      byOracleId: {
        "urza-oracle-id": {
          printings: [
            {
              id: "aaaaaaaa-0000-0000-0000-000000000001",
              set: "brc",
              setName: "The Brothers' War Commander",
              collectorNumber: "1",
              usd: 12.34,
              usdFoil: null
            }
          ]
        }
      }
    };
    writeFileSync(filePath, gzipSync(Buffer.from(JSON.stringify(artifact))));

    const index = loadCardPrintingPricesIndex(filePath);
    expect(index.size).toBe(1);
    const entry = index.get("urza-oracle-id");
    expect(entry?.snapshotDate).toBe("2026-09-08T00:00:00.000Z");
    expect(entry?.printings).toEqual(artifact.byOracleId["urza-oracle-id"].printings);
  });

  it("keeps a printing's null usd/usdFoil as null, never coerced to 0 or dropped", () => {
    dir = mkdtempSync(join(tmpdir(), "card-prices-test-"));
    const filePath = join(dir, "cardPrintingPricesByOracleId.json.gz");
    const artifact = {
      snapshotDate: "2026-09-08T00:00:00.000Z",
      byOracleId: {
        "unpriced-oracle-id": {
          printings: [
            {
              id: "aaaaaaaa-0000-0000-0000-000000000002",
              set: "tst",
              setName: "Test Set",
              collectorNumber: "2",
              usd: null,
              usdFoil: null
            }
          ]
        }
      }
    };
    writeFileSync(filePath, gzipSync(Buffer.from(JSON.stringify(artifact))));

    const index = loadCardPrintingPricesIndex(filePath);
    const printing = index.get("unpriced-oracle-id")?.printings[0];
    expect(printing?.usd).toBeNull();
    expect(printing?.usdFoil).toBeNull();
  });
});
