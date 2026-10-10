import assert from "node:assert/strict";
import test from "node:test";

import { buildCardNameIndex } from "./rulesguru-card-names.mjs";

// Invented cards only.
const detail = {
  "id-bear": { typeLine: "Creature — Bear" },
  "id-cafe": { typeLine: "Creature — Cat" },
  "id-fire-ice": { typeLine: "Instant // Instant" },
  "id-vanilla": { typeLine: "Creature — Squirrel" },
  "id-twin-a": { typeLine: "Creature — Elf" },
  "id-twin-b": { typeLine: "Creature — Elf" },
  "id-spirit-token": { typeLine: "Token Creature — Spirit" },
  "id-spirit-card": { typeLine: "Creature — Spirit" },
  "id-twin-token-a": { typeLine: "Token Creature — Goblin" },
  "id-twin-token-b": { typeLine: "Token Creature — Goblin" },
  "id-no-name": { typeLine: "Land" }
};
const metadata = [
  { cardId: "id-bear", name: "Grizzled Bear" },
  { cardId: "id-cafe", name: "Café Cat" },
  { cardId: "id-fire-ice", name: "Blaze // Frost" },
  { cardId: "id-twin-a", name: "Twin Elf" },
  { cardId: "id-twin-b", name: "Twin Elf" },
  { cardId: "id-spirit-token", name: "Wisp" },
  { cardId: "id-spirit-card", name: "Wisp" },
  { cardId: "id-twin-token-a", name: "Gob" },
  { cardId: "id-twin-token-b", name: "Gob" },
  { cardId: "id-not-in-detail", name: "Ghost Card" }
];
const scanMap = {
  "print-1": { oracleId: "id-vanilla", name: "Plain Squirrel" },
  "print-2": { oracleId: "id-vanilla", name: "Plain Squirrel (other printing)" },
  "print-3": { oracleId: "id-bear", name: "Should Not Override" },
  "print-4": { oracleId: "id-orphan", name: "Orphan" }
};
const index = buildCardNameIndex({ detail, metadata, scanMap });

test("exact, case-insensitive, accent-folded and front-face names resolve", () => {
  assert.deepEqual(index.lookup("Grizzled Bear"), { status: "resolved", oracleId: "id-bear", name: "Grizzled Bear" });
  assert.equal(index.lookup("grizzled BEAR").oracleId, "id-bear");
  assert.equal(index.lookup("Cafe Cat").oracleId, "id-cafe");
  assert.equal(index.lookup("Café Cat").oracleId, "id-cafe");
  assert.equal(index.lookup("Blaze // Frost").oracleId, "id-fire-ice");
  assert.equal(index.lookup("Blaze").oracleId, "id-fire-ice");
  assert.equal(index.lookup("blaze").oracleId, "id-fire-ice");
});

test("a card missing from the metadata file is named from the first scan-map printing", () => {
  assert.equal(index.lookup("Plain Squirrel").oracleId, "id-vanilla");
  assert.equal(index.lookup("Plain Squirrel (other printing)").status, "unresolved");
  assert.equal(index.lookup("Should Not Override").status, "unresolved");
});

test("ids absent from card detail are ignored, and unknown names are unresolved", () => {
  assert.equal(index.lookup("Ghost Card").status, "unresolved");
  assert.equal(index.lookup("Orphan").status, "unresolved");
  assert.equal(index.lookup("No Such Card").status, "unresolved");
  assert.equal(index.lookup("").status, "unresolved");
  assert.equal(index.namedCount, 10);
});

test("a token loses to a non-token; two non-token matches are unresolved, never guessed", () => {
  assert.equal(index.lookup("Wisp").oracleId, "id-spirit-card");
  assert.equal(index.lookup("Twin Elf").status, "ambiguous");
  assert.equal(index.lookup("Gob").status, "ambiguous", "two tokens with no non-token are still ambiguous");
});
