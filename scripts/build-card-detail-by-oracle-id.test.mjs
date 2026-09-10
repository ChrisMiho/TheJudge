// REQ-180: the backend card-detail build carries each card's Scryfall
// `keywords` array, feeding System 3's retrieval query. Offline: constructs
// synthetic Scryfall-shaped card objects rather than depending on the
// gitignored, human-approval-gated bulk data file.
//
// REQ-066: this build also emits the printing-price map in the same pass —
// covered below by `transformCardPrintingPrices` against synthetic printings.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDetailEntry,
  buildPriceEntry,
  normalizePrice,
  resolveSnapshotDate,
  transformCardPrintingPrices
} from "./build-card-detail-by-oracle-id.mjs";

function scryfallCard(overrides = {}) {
  return {
    oracle_id: "test-oracle-id",
    name: "Test Card",
    oracle_text: "This creature has deathtouch.",
    type_line: "Creature — Test",
    mana_cost: "{1}{B}",
    cmc: 2,
    colors: ["B"],
    keywords: ["Deathtouch"],
    ...overrides
  };
}

test("buildDetailEntry carries the card's Scryfall keywords array", () => {
  const entry = buildDetailEntry(scryfallCard());
  assert.deepEqual(entry.keywords, ["Deathtouch"]);
});

test("buildDetailEntry carries every keyword a multi-keyword card has", () => {
  const entry = buildDetailEntry(scryfallCard({ keywords: ["Flying", "Trample", "Vigilance"] }));
  assert.deepEqual(entry.keywords, ["Flying", "Trample", "Vigilance"]);
});

test("buildDetailEntry defaults to an empty array when Scryfall sends no keywords field", () => {
  const card = scryfallCard();
  delete card.keywords;
  const entry = buildDetailEntry(card);
  assert.deepEqual(entry.keywords, []);
});

test("buildDetailEntry ignores a malformed (non-array) keywords field rather than throwing", () => {
  const entry = buildDetailEntry(scryfallCard({ keywords: "Deathtouch" }));
  assert.deepEqual(entry.keywords, []);
});

test("buildDetailEntry still carries every other REQ-176 field alongside keywords", () => {
  const entry = buildDetailEntry(scryfallCard());
  assert.equal(entry.oracleText, "This creature has deathtouch.");
  assert.equal(entry.typeLine, "Creature — Test");
  assert.equal(entry.manaCost, "{1}{B}");
  assert.equal(entry.manaValue, 2);
  assert.deepEqual(entry.colors, ["B"]);
});

// REQ-066: the printing-price map this build now also emits, unified into
// one pass over the same source instead of a fourth extract script.

function scryfallPrinting(overrides = {}) {
  return {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    oracle_id: "test-oracle-id",
    name: "Test Card",
    oracle_text: "This creature has deathtouch.",
    type_line: "Creature — Test",
    mana_cost: "{1}{B}",
    cmc: 2,
    colors: ["B"],
    lang: "en",
    games: ["paper"],
    digital: false,
    set: "tst",
    set_name: "Test Set",
    collector_number: "42",
    prices: { usd: "1.23", usd_foil: null },
    ...overrides
  };
}

test("buildPriceEntry carries a priced printing's identity and USD fields", () => {
  const entry = buildPriceEntry(scryfallPrinting());
  assert.equal(entry.id, "aaaaaaaa-0000-0000-0000-000000000001");
  assert.equal(entry.set, "tst");
  assert.equal(entry.setName, "Test Set");
  assert.equal(entry.collectorNumber, "42");
  assert.equal(entry.usd, 1.23);
  assert.equal(entry.usdFoil, null);
});

test("buildPriceEntry stores a missing price as null, never 0 or omitted", () => {
  const entry = buildPriceEntry(scryfallPrinting({ prices: { usd: null, usd_foil: null } }));
  assert.equal(entry.usd, null);
  assert.equal(entry.usdFoil, null);
  assert.ok("usd" in entry && "usdFoil" in entry, "null price fields stay present, never omitted");
});

test("normalizePrice parses a numeric-string Scryfall price and rejects garbage", () => {
  assert.equal(normalizePrice("1.23"), 1.23);
  assert.equal(normalizePrice(4.5), 4.5);
  assert.equal(normalizePrice(null), null);
  assert.equal(normalizePrice(""), null);
  assert.equal(normalizePrice("not-a-number"), null);
});

test("transformCardPrintingPrices groups every qualifying printing by oracle id, keeping a null price", () => {
  const cards = [
    scryfallPrinting({ id: "aaaaaaaa-0000-0000-0000-000000000001", set: "tst", collector_number: "1" }),
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000002",
      set: "tst2",
      collector_number: "2",
      prices: { usd: null, usd_foil: null }
    })
  ];

  const { cardPrintingPricesByOracleId } = transformCardPrintingPrices(cards, "2026-09-08T00:00:00.000Z");

  assert.equal(cardPrintingPricesByOracleId.snapshotDate, "2026-09-08T00:00:00.000Z");
  const printings = cardPrintingPricesByOracleId.byOracleId["test-oracle-id"].printings;
  assert.equal(printings.length, 2);
  const priced = printings.find((printing) => printing.id === "aaaaaaaa-0000-0000-0000-000000000001");
  const unpriced = printings.find((printing) => printing.id === "aaaaaaaa-0000-0000-0000-000000000002");
  assert.equal(priced.usd, 1.23);
  assert.equal(unpriced.usd, null);
  assert.equal(unpriced.usdFoil, null);
});

test("transformCardPrintingPrices keeps every printing of an oracle even though card-detail dedupes to one preferred card", () => {
  const cards = [
    scryfallPrinting({ id: "aaaaaaaa-0000-0000-0000-000000000001", released_at: "2020-01-01" }),
    scryfallPrinting({ id: "aaaaaaaa-0000-0000-0000-000000000002", released_at: "2021-01-01" })
  ];

  const { cardPrintingPricesByOracleId } = transformCardPrintingPrices(cards, "2026-09-08T00:00:00.000Z");
  assert.equal(cardPrintingPricesByOracleId.byOracleId["test-oracle-id"].printings.length, 2);
});

// A1/A2/A3: newest-release-first printing order, decided at build time.

test("A1: transformCardPrintingPrices sorts printings by released_at descending, then collector number, then id", () => {
  const cards = [
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000003",
      collector_number: "5",
      released_at: "2019-06-01"
    }),
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000001",
      collector_number: "10",
      released_at: "2022-01-01"
    }),
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000002",
      collector_number: "2",
      released_at: "2022-01-01"
    })
  ];

  const { cardPrintingPricesByOracleId } = transformCardPrintingPrices(cards, "2026-09-09T00:00:00.000Z");
  const printings = cardPrintingPricesByOracleId.byOracleId["test-oracle-id"].printings;

  // Newest release first: both 2022 printings before the 2019 one.
  // Among the two 2022 printings (same released_at), collector "2" before "10"
  // (numeric-aware — a plain string compare would put "10" first).
  assert.deepEqual(
    printings.map((printing) => printing.id),
    [
      "aaaaaaaa-0000-0000-0000-000000000002",
      "aaaaaaaa-0000-0000-0000-000000000001",
      "aaaaaaaa-0000-0000-0000-000000000003"
    ]
  );
});

test("A1: ties on released_at and collector number fall back to printing id as a deterministic tiebreak", () => {
  const cards = [
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000002",
      collector_number: "1",
      released_at: "2022-01-01"
    }),
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000001",
      collector_number: "1",
      released_at: "2022-01-01"
    })
  ];

  const { cardPrintingPricesByOracleId } = transformCardPrintingPrices(cards, "2026-09-09T00:00:00.000Z");
  const printings = cardPrintingPricesByOracleId.byOracleId["test-oracle-id"].printings;

  assert.deepEqual(
    printings.map((printing) => printing.id),
    ["aaaaaaaa-0000-0000-0000-000000000001", "aaaaaaaa-0000-0000-0000-000000000002"]
  );
});

test("A2: a printing with a missing or unparseable released_at sorts last", () => {
  const cards = [
    scryfallPrinting({ id: "aaaaaaaa-0000-0000-0000-000000000001", released_at: "not-a-date" }),
    scryfallPrinting({ id: "aaaaaaaa-0000-0000-0000-000000000002", released_at: "2020-01-01" })
  ];
  delete cards[0].released_at;

  const { cardPrintingPricesByOracleId } = transformCardPrintingPrices(cards, "2026-09-09T00:00:00.000Z");
  const printings = cardPrintingPricesByOracleId.byOracleId["test-oracle-id"].printings;

  assert.deepEqual(
    printings.map((printing) => printing.id),
    ["aaaaaaaa-0000-0000-0000-000000000002", "aaaaaaaa-0000-0000-0000-000000000001"]
  );
});

test("A2: an unparseable (non-empty garbage) released_at also sorts last, not first", () => {
  const cards = [
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000001",
      collector_number: "1",
      released_at: "not-a-real-date"
    }),
    scryfallPrinting({
      id: "aaaaaaaa-0000-0000-0000-000000000002",
      collector_number: "2",
      released_at: "2018-05-01"
    })
  ];

  const { cardPrintingPricesByOracleId } = transformCardPrintingPrices(cards, "2026-09-09T00:00:00.000Z");
  const printings = cardPrintingPricesByOracleId.byOracleId["test-oracle-id"].printings;

  assert.deepEqual(
    printings.map((printing) => printing.id),
    ["aaaaaaaa-0000-0000-0000-000000000002", "aaaaaaaa-0000-0000-0000-000000000001"]
  );
});

test("A3: buildPriceEntry's emitted field set is exactly id, set, setName, collectorNumber, usd, usdFoil — no releasedAt", () => {
  const entry = buildPriceEntry(scryfallPrinting({ released_at: "2020-01-01" }));
  assert.deepEqual(Object.keys(entry).sort(), ["collectorNumber", "id", "set", "setName", "usd", "usdFoil"].sort());
});

test("resolveSnapshotDate falls back to the build date when no meta sidecar or input file exists", () => {
  const now = new Date("2026-09-08T12:00:00.000Z");
  const date = resolveSnapshotDate(
    "/nonexistent/default-cards.json",
    "/nonexistent/default-cards.meta.json",
    now
  );
  assert.equal(date, now.toISOString());
});
