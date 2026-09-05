// REQ-180: the backend card-detail build carries each card's Scryfall
// `keywords` array, feeding System 3's retrieval query. Offline: constructs
// synthetic Scryfall-shaped card objects rather than depending on the
// gitignored, human-approval-gated bulk data file.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDetailEntry } from "./build-card-detail-by-oracle-id.mjs";

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
