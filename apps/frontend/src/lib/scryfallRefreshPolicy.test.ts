import { describe, expect, it } from "vitest";
import {
  createBulkDownloadTargets,
  createComprehensiveRulesDownloadTarget,
  createScryfallRequestOptions,
  shouldRunDataBuildAfterRefresh
} from "../../../../scripts/refresh-scryfall-data.mjs";

describe("Frontend - Shared", () => {
describe("Scryfall refresh policy", () => {
  it("selects default cards and rulings bulk targets with local output paths", () => {
    const payload = {
      data: [
        {
          type: "default_cards",
          download_uri: "https://example.test/default-cards.json",
          updated_at: "2026-06-01T00:00:00.000+00:00",
          size: 515_000_000
        },
        {
          type: "rulings",
          download_uri: "https://example.test/rulings.json",
          updated_at: "2026-06-02T00:00:00.000+00:00",
          size: 24_000_000
        }
      ]
    };

    expect(createBulkDownloadTargets(payload)).toEqual([
      {
        type: "default_cards",
        label: "default_cards",
        downloadUrl: "https://example.test/default-cards.json",
        isJsonlGz: false,
        updatedAt: "2026-06-01T00:00:00.000+00:00",
        estimatedSize: 515_000_000,
        outputPath: expect.stringContaining("apps/frontend/data/scryfall/default-cards.json"),
        tempPath: expect.stringContaining("apps/frontend/data/scryfall/default-cards.json.tmp")
      },
      {
        type: "rulings",
        label: "rulings",
        downloadUrl: "https://example.test/rulings.json",
        isJsonlGz: false,
        updatedAt: "2026-06-02T00:00:00.000+00:00",
        estimatedSize: 24_000_000,
        outputPath: expect.stringContaining("apps/backend/data/scryfall/rulings.json"),
        tempPath: expect.stringContaining("apps/backend/data/scryfall/rulings.json.tmp")
      }
    ]);
  });

  it("prefers Scryfall's gzipped JSONL export (jsonl_download_uri) over the retired download_uri", () => {
    const payload = {
      data: [
        {
          type: "default_cards",
          jsonl_download_uri: "https://example.test/default-cards.jsonl.gz",
          updated_at: "2026-09-08T00:00:00.000+00:00",
          compressed_size: 78_000_000
        },
        {
          type: "rulings",
          jsonl_download_uri: "https://example.test/rulings.jsonl.gz",
          updated_at: "2026-09-08T00:00:00.000+00:00",
          compressed_size: 5_000_000
        }
      ]
    };

    const targets = createBulkDownloadTargets(payload) as Array<{
      downloadUrl: string;
      isJsonlGz: boolean;
      estimatedSize: number;
    }>;
    expect(targets[0].downloadUrl).toBe("https://example.test/default-cards.jsonl.gz");
    expect(targets[0].isJsonlGz).toBe(true);
    expect(targets[0].estimatedSize).toBe(78_000_000);
    expect(targets[1].isJsonlGz).toBe(true);
  });

  it("identifies this app to Scryfall instead of using default library headers", () => {
    expect(createScryfallRequestOptions()).toEqual({
      headers: {
        Accept: "application/json",
        "User-Agent": expect.stringContaining("TheJudge")
      }
    });
  });

  it("defines a gitignored WotC Comprehensive Rules TXT download target", () => {
    expect(createComprehensiveRulesDownloadTarget("https://media.wizards.com/rules.txt")).toEqual({
      label: "Comprehensive Rules TXT",
      downloadUrl: "https://media.wizards.com/rules.txt",
      outputPath: expect.stringContaining("apps/backend/data/cr/source.txt"),
      tempPath: expect.stringContaining("apps/backend/data/cr/source.txt.tmp")
    });
  });

  it("runs local transforms only after at least one refresh download succeeds", () => {
    expect(shouldRunDataBuildAfterRefresh(0)).toBe(false);
    expect(shouldRunDataBuildAfterRefresh(1)).toBe(true);
    expect(shouldRunDataBuildAfterRefresh(3)).toBe(true);
  });
});
});
