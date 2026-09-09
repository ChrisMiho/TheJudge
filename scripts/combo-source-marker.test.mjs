import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  combosNeedRefresh,
  hashOracleIdSet,
  hashTemplateSet,
  readComboSourceMarker,
  writeComboSourceMarker
} from "./lib/combo-source-marker.mjs";

// ---- card-identity hash (D1) ----

test("hashOracleIdSet is order-independent and de-duplicates", () => {
  assert.equal(hashOracleIdSet(["b", "a", "c"]), hashOracleIdSet(["c", "c", "a", "b"]));
});

test("hashOracleIdSet is unchanged by non-identity churn (only ids feed it)", () => {
  // A price-only card update never changes the oracle-id set, so the hash holds.
  const before = hashOracleIdSet(["id-1", "id-2", "id-3"]);
  const afterPriceChange = hashOracleIdSet(["id-3", "id-1", "id-2"]);
  assert.equal(before, afterPriceChange);
});

test("hashOracleIdSet changes when an oracle id is added or removed", () => {
  const base = hashOracleIdSet(["id-1", "id-2"]);
  assert.notEqual(base, hashOracleIdSet(["id-1", "id-2", "id-3"]));
  assert.notEqual(base, hashOracleIdSet(["id-1"]));
});

// ---- template-set hash (D2) ----

test("hashTemplateSet is stable for the same set and changes on id or query change", () => {
  const set = [
    { templateId: 5, scryfallApi: "https://api.scryfall.com/q-a" },
    { templateId: 9, scryfallApi: "https://api.scryfall.com/q-b" }
  ];
  const reordered = [set[1], set[0]];
  assert.equal(hashTemplateSet(set), hashTemplateSet(reordered));
  assert.notEqual(
    hashTemplateSet(set),
    hashTemplateSet([{ templateId: 5, scryfallApi: "https://api.scryfall.com/q-a" }, { templateId: 10, scryfallApi: "https://api.scryfall.com/q-b" }])
  );
  assert.notEqual(
    hashTemplateSet(set),
    hashTemplateSet([{ templateId: 5, scryfallApi: "https://api.scryfall.com/CHANGED" }, { templateId: 9, scryfallApi: "https://api.scryfall.com/q-b" }])
  );
});

// ---- gate + marker (D5) ----

test("combosNeedRefresh treats a missing marker or an uncomputable hash as changed", () => {
  const hashes = { cardIdentityHash: "CARD", templateSetHash: "TMPL" };
  assert.equal(combosNeedRefresh(null, hashes), true, "no marker => refresh");
  assert.equal(combosNeedRefresh({ cardIdentityHash: "CARD", templateSetHash: "TMPL" }, { cardIdentityHash: null, templateSetHash: "TMPL" }), true, "null card hash => refresh");
  assert.equal(combosNeedRefresh({ cardIdentityHash: "CARD", templateSetHash: "TMPL" }, hashes), false, "both match => reuse");
  assert.equal(combosNeedRefresh({ cardIdentityHash: "OLD", templateSetHash: "TMPL" }, hashes), true, "card hash differs => refresh");
  assert.equal(combosNeedRefresh({ cardIdentityHash: "CARD", templateSetHash: "OLD" }, hashes), true, "template hash differs => refresh");
});

test("readComboSourceMarker returns null for a missing or malformed file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "combo-marker-"));
  const missing = path.join(dir, "nope.json");
  assert.equal(readComboSourceMarker(missing), null);
  const bad = path.join(dir, "bad.json");
  fs.writeFileSync(bad, "{not json");
  assert.equal(readComboSourceMarker(bad), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("writeComboSourceMarker round-trips both hashes and is read back by the gate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "combo-marker-"));
  const markerPath = path.join(dir, "marker.json");
  writeComboSourceMarker(markerPath, { cardIdentityHash: "CARD", templateSetHash: "TMPL", exportVersion: "6.4.0", exportTimestamp: "t" });
  const marker = readComboSourceMarker(markerPath);
  assert.equal(marker.cardIdentityHash, "CARD");
  assert.equal(marker.templateSetHash, "TMPL");
  assert.equal(combosNeedRefresh(marker, { cardIdentityHash: "CARD", templateSetHash: "TMPL" }), false);
  fs.rmSync(dir, { recursive: true, force: true });
});
