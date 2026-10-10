import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  CASES_DIR,
  REQUIRED_SIX_CASE_IDS,
  compareSnapshot,
  computeSnapshot,
  deriveDifficulty,
  deriveTags,
  findDuplicateErrors,
  loadGoldCases,
  mechanicPrefixes,
  readCaseFiles,
  sha256,
  validateGoldCase
} from "./gold-cases.mjs";

const ZERO_HASH = "0".repeat(64);

function validTier1Case(overrides = {}) {
  return {
    id: "sample-tier-1",
    formatVersion: 2,
    tier: 1,
    review: { status: "draft", reviewedOn: null },
    cards: [],
    gameState: null,
    question: "Sample question?",
    expected: {
      outcome: "works",
      shortAnswer: "Yes.",
      answer: "Sample official answer text.",
      decidingRuleIds: ["100.1"]
    },
    source: {
      authority: "wotc-comprehensive-rules",
      publisher: "Wizards of the Coast",
      license: "Reproduced under the Wizards of the Coast Fan Content Policy.",
      ruleId: "100.1"
    },
    layers: { requiredFacts: [], irrelevantFacts: [], variants: [] },
    snapshot: { ruleIndexHash: ZERO_HASH, dependsOnHashes: { rules: ZERO_HASH, oracle: ZERO_HASH, rulings: ZERO_HASH } },
    whyHard: "Sample reason this is hard.",
    ...overrides
  };
}

function validTier2Case(overrides = {}) {
  return validTier1Case({
    id: "sample-tier-2",
    tier: 2,
    cards: [{ oracleId: "00000000-0000-0000-0000-000000000000", name: "Sample Card" }],
    source: {
      authority: "wotc-card-ruling",
      publisher: "Wizards of the Coast",
      license: "Reproduced from official card-ruling text.",
      cardName: "Sample Card",
      oracleId: "00000000-0000-0000-0000-000000000000",
      rulingDate: "2020-01-01"
    },
    ...overrides
  });
}

function validTier3Case(overrides = {}) {
  return validTier1Case({
    id: "sample-tier-3",
    tier: 3,
    source: {
      authority: "owner-approved-derived",
      publisher: "Owner",
      license: "Owner-approved derivation from Comprehensive Rules text.",
      citation: "CR 514.1, 514.2",
      research: ["a discussion used only to find the question"]
    },
    ...overrides
  });
}

function gameStateWith(zones, cards) {
  return {
    cards,
    gameState: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "main_1",
      selectedZones: Object.keys(zones),
      zones
    }
  };
}

const SPELL = { oracleId: "11111111-1111-4111-8111-111111111111", name: "Spell" };
const CREATURE = { oracleId: "22222222-2222-4222-8222-222222222222", name: "Creature" };

function errorsOf(caseEntry) {
  const result = validateGoldCase(caseEntry);
  assert.equal(result.valid, false);
  return result.errors.join("\n");
}

test("validateGoldCase accepts a well-formed case of each tier", () => {
  for (const caseEntry of [validTier1Case(), validTier2Case(), validTier3Case()]) {
    const result = validateGoldCase(caseEntry);
    assert.equal(result.valid, true, result.errors.join("; "));
    assert.deepEqual(result.errors, []);
  }
});

test("validateGoldCase rejects each v2 validation error", () => {
  assert.match(errorsOf(validTier1Case({ id: "" })), /missing non-empty "id"/);
  assert.match(errorsOf(validTier1Case({ formatVersion: 1 })), /"formatVersion" must be 2/);
  assert.match(errorsOf(validTier1Case({ tier: 4 })), /"tier" must be 1, 2 or 3/);
  assert.match(errorsOf(validTier1Case({ question: "" })), /"question"/);
  assert.match(errorsOf(validTier1Case({ whyHard: "" })), /"whyHard"/);
  assert.match(errorsOf(validTier1Case({ review: undefined })), /missing "review" block/);
  assert.match(errorsOf(validTier1Case({ review: { status: "maybe", reviewedOn: null } })), /review\.status must be one of/);
  assert.match(errorsOf(validTier1Case({ cards: undefined })), /"cards" must be an array/);
  assert.match(errorsOf(validTier1Case({ cards: [{ oracleId: "x" }] })), /cards\[0\] needs a non-empty/);
  assert.match(errorsOf(validTier1Case({ gameState: undefined })), /missing "gameState"/);
  assert.match(errorsOf(validTier1Case({ expected: undefined })), /missing "expected" block/);
  assert.match(
    errorsOf(validTier1Case({ expected: { outcome: "sometimes", shortAnswer: "s", answer: "a", decidingRuleIds: ["1.1"] } })),
    /expected\.outcome must be one of/
  );
  assert.match(
    errorsOf(validTier1Case({ expected: { outcome: "works", answer: "a", decidingRuleIds: ["1.1"] } })),
    /"expected\.shortAnswer"/
  );
  assert.match(
    errorsOf(validTier1Case({ expected: { outcome: "works", shortAnswer: "s", decidingRuleIds: ["1.1"] } })),
    /"expected\.answer"/
  );
  assert.match(
    errorsOf(validTier1Case({ expected: { outcome: "works", shortAnswer: "s", answer: "a", decidingRuleIds: [] } })),
    /at least one "expected\.decidingRuleIds"/
  );
  assert.match(errorsOf(validTier1Case({ source: undefined })), /missing "source" block/);
  assert.match(errorsOf(validTier1Case({ layers: undefined })), /missing "layers" block/);
  assert.match(errorsOf(validTier1Case({ snapshot: undefined })), /missing "snapshot" block/);
  assert.match(
    errorsOf(validTier1Case({ snapshot: { ruleIndexHash: "nope", dependsOnHashes: { rules: ZERO_HASH } } })),
    /snapshot\.ruleIndexHash must be a SHA-256/
  );
});

test("validateGoldCase requires review.reviewedOn once a case is not a draft", () => {
  assert.match(errorsOf(validTier1Case({ review: { status: "approved", reviewedOn: null } })), /reviewedOn is required/);
  assert.match(errorsOf(validTier1Case({ review: { status: "rejected", reviewedOn: null } })), /reviewedOn is required/);
  assert.equal(validateGoldCase(validTier1Case({ review: { status: "approved", reviewedOn: "2026-10-06" } })).valid, true);
  assert.equal(validateGoldCase(validTier1Case({ review: { status: "draft", reviewedOn: null } })).valid, true);
});

test("validateGoldCase checks the citation each tier requires, and the authority that goes with it", () => {
  const publisherLicense = { publisher: "WotC", license: "x" };
  assert.match(
    errorsOf(validTier1Case({ source: { authority: "wotc-comprehensive-rules", ...publisherLicense } })),
    /tier 1 source needs a non-empty "ruleId"/
  );
  const tier2Errors = errorsOf(validTier2Case({ source: { authority: "wotc-card-ruling", ...publisherLicense } }));
  assert.match(tier2Errors, /cardName/);
  assert.match(tier2Errors, /oracleId/);
  assert.match(tier2Errors, /rulingDate/);
  const tier3Errors = errorsOf(validTier3Case({ source: { authority: "owner-approved-derived", ...publisherLicense } }));
  assert.match(tier3Errors, /tier 3 source needs a non-empty "citation"/);
  assert.match(tier3Errors, /tier 3 source needs a non-empty "research"/);
  assert.match(
    errorsOf(validTier3Case({ source: { ...validTier3Case().source, authority: "wotc-card-ruling" } })),
    /tier 3 source\.authority must be "owner-approved-derived"/
  );
});

test("validateGoldCase accepts an optional source.pool from the known pools and rejects any other", () => {
  for (const pool of ["mechanic", "cr-example", "two-card-ruling", "tester"]) {
    const caseEntry = validTier1Case({ source: { ...validTier1Case().source, pool } });
    assert.equal(validateGoldCase(caseEntry).valid, true, pool);
  }
  assert.match(errorsOf(validTier1Case({ source: { ...validTier1Case().source, pool: "other" } })), /source\.pool must be one of/);
});

test("validateGoldCase refuses hand-written tags and difficulty: the loader derives them", () => {
  assert.match(errorsOf(validTier1Case({ tags: ["mechanic:none"] })), /"tags" is derived by the loader/);
  assert.match(errorsOf(validTier1Case({ difficulty: 3 })), /"difficulty" is derived by the loader/);
});

test("the loader rejects a gameState with owner on a stack item, and one with caster on a battlefield card (A15)", () => {
  const ownerOnStack = validTier1Case(
    gameStateWith({ stack: [{ cardId: SPELL.oracleId, name: "Spell", owner: "Player 1" }] }, [SPELL])
  );
  assert.match(errorsOf(ownerOnStack), /sets "owner" on a stack item/);

  const casterOnBattlefield = validTier1Case(
    gameStateWith({ battlefield: [{ cardId: CREATURE.oracleId, name: "Creature", caster: "Player 1" }] }, [CREATURE])
  );
  assert.match(errorsOf(casterOnBattlefield), /sets "caster" on a card outside the stack/);

  const fine = validTier1Case(
    gameStateWith(
      {
        stack: [{ cardId: SPELL.oracleId, name: "Spell", caster: "Player 1" }],
        battlefield: [{ cardId: CREATURE.oracleId, name: "Creature", owner: "Player 2" }]
      },
      [SPELL, CREATURE]
    )
  );
  assert.equal(validateGoldCase(fine).valid, true);
});

test("the loader requires every gameState card to be an attached card and every attached card to sit in a zone", () => {
  const stranger = validTier1Case(
    gameStateWith({ battlefield: [{ cardId: "99999999-9999-4999-8999-999999999999", name: "Stranger" }] }, [CREATURE])
  );
  const strangerErrors = errorsOf(stranger);
  assert.match(strangerErrors, /is not in "cards"/);
  assert.match(strangerErrors, /in no gameState zone/);

  assert.match(errorsOf(validTier1Case({ gameState: "not an object" })), /must be null or an object/);
  assert.match(
    errorsOf(validTier1Case(gameStateWith({ moon: [{ cardId: SPELL.oracleId }] }, [SPELL]))),
    /unknown zone "moon"/
  );
});

test("mechanic tags come from 701/702 ids in the deciding rules; cr tags from every section; mechanic:none otherwise", () => {
  assert.deepEqual(mechanicPrefixes(["702.19b", "702.19c", "701.8a", "510.1c"]), ["702.19", "701.8"]);
  assert.deepEqual(deriveTags(validTier1Case({ expected: { ...validTier1Case().expected, decidingRuleIds: ["702.19b"] } })), [
    "mechanic:702.19",
    "cr:702"
  ]);
  assert.deepEqual(
    deriveTags(validTier1Case({ expected: { ...validTier1Case().expected, decidingRuleIds: ["614.1a", "616.1", "616.1e"] } })),
    ["mechanic:none", "cr:614", "cr:616"]
  );
});

test("difficulty counts attached cards and distinct sections, and flags layers, replacement and multiplayer", () => {
  const difficulty = deriveDifficulty(
    validTier2Case({ expected: { ...validTier1Case().expected, decidingRuleIds: ["613.9", "614.5", "810.2"] } })
  );
  assert.equal(difficulty.cardCount, 1);
  assert.equal(difficulty.sectionCount, 3);
  assert.deepEqual(difficulty.flags, ["layers", "replacement", "multiplayer"]);
  assert.equal(difficulty.score, 7);
});

test("findDuplicateErrors flags a repeated id, a repeated question, and the same cards with the same answer", () => {
  const a = validTier2Case({ id: "a" });
  assert.deepEqual(findDuplicateErrors([a, validTier2Case({ id: "b", question: "Another question?", expected: { ...a.expected, answer: "Different." } })]), []);
  assert.match(findDuplicateErrors([a, validTier2Case({ id: "a", question: "Other?", expected: { ...a.expected, answer: "Other." } })]).join("\n"), /duplicate id/);
  assert.match(
    findDuplicateErrors([a, validTier2Case({ id: "b", expected: { ...a.expected, answer: "Different." } })]).join("\n"),
    /same question text/
  );
  assert.match(
    findDuplicateErrors([a, validTier2Case({ id: "b", question: "Reworded?" })]).join("\n"),
    /same attached cards and answer source/
  );
  // The same answer on different attached cards is a different interaction.
  assert.deepEqual(
    findDuplicateErrors([a, validTier2Case({ id: "b", question: "Reworded?", cards: [{ oracleId: "x", name: "X" }] })]),
    []
  );
});

// In-memory snapshot sources so these tests never read the 2 MB rule index.
function fakeSources(overrides = {}) {
  const data = {
    rules: { "100.1": "100.1. A rule.", "200.2": "200.2. Another rule." },
    oracle: { "00000000-0000-0000-0000-000000000000": "Oracle text." },
    rulings: { "00000000-0000-0000-0000-000000000000": [{ publishedAt: "2020-01-01", comment: "A ruling." }] },
    ...overrides
  };
  return {
    ruleIndexHash: sha256("index"),
    ruleText: (ruleId) => data.rules[ruleId] ?? null,
    oracleText: (oracleId) => data.oracle[oracleId] ?? null,
    rulings: (oracleId) => data.rulings[oracleId] ?? []
  };
}

test("snapshot hashing is deterministic, ignores the order ids are listed in, and records the rule-index file hash", () => {
  const sources = fakeSources();
  const first = computeSnapshot(validTier2Case({ expected: { ...validTier1Case().expected, decidingRuleIds: ["100.1", "200.2"] } }), sources);
  const reordered = computeSnapshot(validTier2Case({ expected: { ...validTier1Case().expected, decidingRuleIds: ["200.2", "100.1"] } }), sources);
  assert.deepEqual(first, reordered);
  assert.equal(first.ruleIndexHash, sha256("index"));
  for (const key of ["rules", "oracle", "rulings"]) assert.match(first.dependsOnHashes[key], /^[0-9a-f]{64}$/);
});

test("the stale comparison passes unchanged data and flags a changed rule, oracle or ruling hash, naming it (A18)", () => {
  const caseEntry = validTier2Case();
  const sources = fakeSources();
  const authored = { ...caseEntry, snapshot: computeSnapshot(caseEntry, sources) };

  assert.deepEqual(compareSnapshot(authored, sources), { stale: false, changed: [] });

  const ruleChanged = fakeSources({ rules: { "100.1": "100.1. A rule, reworded." } });
  assert.deepEqual(compareSnapshot(authored, ruleChanged), { stale: true, changed: ["rules"] });

  const oracleChanged = fakeSources({ oracle: { "00000000-0000-0000-0000-000000000000": "Errata'd oracle text." } });
  assert.deepEqual(compareSnapshot(authored, oracleChanged), { stale: true, changed: ["oracle"] });

  const rulingChanged = fakeSources({
    rulings: {
      "00000000-0000-0000-0000-000000000000": [
        { publishedAt: "2020-01-01", comment: "A ruling." },
        { publishedAt: "2026-01-01", comment: "A new ruling." }
      ]
    }
  });
  assert.deepEqual(compareSnapshot(authored, rulingChanged), { stale: true, changed: ["rulings"] });

  // The whole-file hash is recorded for provenance only: a refreshed index that leaves this case's own text alone does not flag it.
  const reindexed = { ...fakeSources(), ruleIndexHash: sha256("a different index file") };
  assert.deepEqual(compareSnapshot(authored, reindexed), { stale: false, changed: [] });
});

test("loadGoldCases reads and validates every committed *.case.json file and adds derived tags", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  assert.ok(cases.length >= 18, `expected at least 18 cases, got ${cases.length}`);
  for (const caseEntry of cases) {
    const { tags, difficulty, ...stored } = caseEntry;
    const { valid, errors } = validateGoldCase(stored);
    assert.equal(valid, true, `case ${caseEntry.id} failed validation: ${errors.join("; ")}`);
    assert.deepEqual(tags, deriveTags(stored));
    assert.deepEqual(difficulty, deriveDifficulty(stored));
  }
});

test("the corpus holds at least the six named worked-solution cases, each tier 1", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  const byId = new Map(cases.map((c) => [c.id, c]));
  for (const requiredId of REQUIRED_SIX_CASE_IDS) {
    const found = byId.get(requiredId);
    assert.ok(found, `missing required case ${requiredId}`);
    assert.equal(found.tier, 1, `${requiredId} must be tier 1`);
  }
});

test("loadGoldCases throws naming every problem for an invalid case, and rejects duplicates, without silently scoring a miss", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gold-cases-"));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(dir, "good.case.json"), JSON.stringify(validTier1Case({ id: "good" })), "utf8");
  fs.writeFileSync(path.join(dir, "bad.case.json"), JSON.stringify({ id: "bad" }), "utf8");
  await assert.rejects(() => loadGoldCases(dir), /Invalid gold case\(s\)[\s\S]*bad\.case\.json/);

  fs.rmSync(path.join(dir, "bad.case.json"));
  fs.writeFileSync(path.join(dir, "twin.case.json"), JSON.stringify(validTier1Case({ id: "twin" })), "utf8");
  await assert.rejects(() => loadGoldCases(dir), /same question text as good/);
});

// ---------------------------------------------------------------------------
// The migration of the 18 first-ship cases (REQ-185, A1)
// ---------------------------------------------------------------------------

// SHA-256 of each case's version-1 `question` and `workedSolution`, recorded
// from the files as committed before the format-version-2 migration.
const PRE_MIGRATION_HASHES = {
  "combat-damage-assignment-order-multiple-blockers": {
    question: "9fb0fe1abd1b02b9593b9f43f949176da05d50e411bdfff269311fc8b5456265",
    answer: "c6686f7c64eb6dcf200e392c17e49df121346561736357f1772f8b52cbf25673"
  },
  "copy-does-not-copy-etb-choices": {
    question: "146273f989825da5efe3f02c84ca3c60b782a0511fd84c4a50b8dc1e3e7ff13c",
    answer: "68465336990060cbbf80722aa8ef0556bd68cc68463030f70f6c4291c075e4a0"
  },
  "copy-effect-modification-becomes-copiable": {
    question: "13a008c9c3060e4e1b390bfff94e50b5d392acf998845d127ea24275ce85ce09",
    answer: "9ab0789e6b985fb540b0f7a9308613b56430c2b63fd737923c7f82b851e410b0"
  },
  "damage-does-not-destroy-sba-does": {
    question: "29f44c11016bf0e26e7cddc705aa57f36b8fd4f46fdbcafc3e38a44540c3ed37",
    answer: "9606e5e6774dfaf72aff9ab3e4c411884cec0d74b2cb606622821124310236f2"
  },
  "delayed-trigger-created-too-late": {
    question: "79a50d183025d3dfbe33eae0811fc491022bbeeaa0e33acef977bc4048c9509b",
    answer: "f67c8986a52dd34f179edc84bde68cae63dc96db375c69731288a470ba2d4353"
  },
  "illegal-target-partial-resolution": {
    question: "797d9dbdb3ad82e534e396c2de361d7fb47521f9555edee95e4caf7eaccb104b",
    answer: "25301227d21cb980e9009f9b091346625ef14c58b01a77cae41aadbecba2f1ff"
  },
  "last-known-information-simultaneous-sba": {
    question: "943bc46ecdcb8505d541d4cc343691f107eb68bbc903911a345c5bfe94d3d5a5",
    answer: "0a08c81d24489e31c5ed6670fbc6b50c6243aaaae1ae469b36ca3d4def5cbe0c"
  },
  "layers-timestamp-order": {
    question: "17641d7963efd3dffff363df8e6f0e2c3707fa39988f0cf1800622de41835916",
    answer: "5ff58d8ca4e9632a19e00e4789569ad25ac4f8c564e4642455cb7890bdde7c64"
  },
  "mana-ability-remains-mana-ability": {
    question: "5d1d6d2312b249785c0e39b780c82f341cfc4dd5c0855c992e4405b4ea595a07",
    answer: "6f5fa52568a5712a2cd6005ef35267bdbd112bbc69cf97e294d333d710c371f4"
  },
  "panharmonicon-controller-not-entering-permanent": {
    question: "0c7bb641525be1113658709b578cd0ec39faa29d4875f52e19dc7bf9cc2816da",
    answer: "e199f4fe47677e1fb8a816c4a71fb8b166f3efccf4c7025484e3e13609dd6ca7"
  },
  "regenerate-too-late-after-destroy-resolves": {
    question: "c5ee6677c62fb5fa26b1e4cb074a12bce823c2c872b8461b5533e505be6614b8",
    answer: "f38df7f9d1cef67091777aa67f13eb0e321dac01536f34af1399f0dc633d363a"
  },
  "replacement-effect-single-application": {
    question: "c73f6574f0355e266e24e2e2a5b3bccf510bfda00128f182be878906ac98d5d1",
    answer: "7e8100378d000b42d6b11c92a16762f802584c024067ccafdc55a25dda56f6fe"
  },
  "restoration-angel-blink-resets-counters": {
    question: "74853efe4a22040bf1c046c86cc9872efbfc6a9aafa8dfe7375b8066a330fe95",
    answer: "3beb5b34ca5f7b370278a44a19f010b72fc3d856abc1ef9d6116663ea4c9184b"
  },
  "sensei-top-leaves-battlefield-ability-on-stack": {
    question: "40a1e20dbb34e3f52383d555820da59b676f8753f1fc2574289a27b3153cdc97",
    answer: "799e9c981cb7994b35b8caa1ceef89a8fb9b3a95c546927f90fbebd8d9b7ab82"
  },
  "state-based-actions-mid-resolution": {
    question: "953445bd0d4f3a140ad7e8a85641dfd685a8c93676d288b190110c74dc3a0e0d",
    answer: "4b8374f8edf7c7daaafc40293e335424f824203cdb1b95ad28e872315a748334"
  },
  "token-created-by-name-uses-oracle-card": {
    question: "e96bd3ac2dd9088b2a2f7c8e938ec4705311deb7537353bb71439277e27bbf53",
    answer: "54da0573d3bea1111c11d434fd782eaef64d5bd8e948fff3dad1ebc29047545b"
  },
  "trample-must-assign-lethal-first": {
    question: "96fdaa7f0f7dd54e9c47737ae73317f1bc3686cf50b0bb2ee7ef718da118805b",
    answer: "bdac58725bb7475016853e41086adac8f1ba986af66ce28d5ee1a2c41cbbec9e"
  },
  "trample-over-planeswalkers-assignment": {
    question: "0d798f942b8aa99f9ab161543113ed24769d56afac92fa0acba6fb7d919163c4",
    answer: "bbb4c59309ef24343262baa91b7edbaa01d4aa2080a926a1597d1270bfe8bff9"
  }
};

test("the 18 migrated cases keep their question and answer text byte-identical (A1)", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  const byId = new Map(cases.map((caseEntry) => [caseEntry.id, caseEntry]));
  assert.equal(Object.keys(PRE_MIGRATION_HASHES).length, 18);
  for (const [id, hashes] of Object.entries(PRE_MIGRATION_HASHES)) {
    const migrated = byId.get(id);
    assert.ok(migrated, `missing migrated case ${id}`);
    assert.equal(sha256(migrated.question), hashes.question, `${id}: question text changed`);
    assert.equal(sha256(migrated.expected.answer), hashes.answer, `${id}: answer text changed`);
  }
});

test("each migrated case is approved by the owner's accept of REQ-185, dated at migration, with a review note naming the source", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  for (const id of Object.keys(PRE_MIGRATION_HASHES)) {
    const migrated = cases.find((caseEntry) => caseEntry.id === id);
    assert.equal(migrated.review.status, "approved", id);
    assert.match(migrated.review.reviewedOn, /^\d{4}-\d{2}-\d{2}$/, id);
    assert.equal(
      migrated.review.note,
      "approved by the owner's accept of REQ-185 at the define gate; migrated to format version 2",
      id
    );
  }
});

test("each migrated case's cards match A14: tier-2 cards carry their cited card, the token case carries Tarmogoyf, the rest are empty", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  for (const id of Object.keys(PRE_MIGRATION_HASHES)) {
    const migrated = cases.find((caseEntry) => caseEntry.id === id);
    if (migrated.tier === 2) {
      assert.deepEqual(
        migrated.cards,
        [{ oracleId: migrated.source.oracleId, name: migrated.source.cardName }],
        `${id}: a tier-2 case carries its cited card`
      );
    } else if (id === "token-created-by-name-uses-oracle-card") {
      assert.deepEqual(migrated.cards, [{ oracleId: "45900b2f-f6a9-4c42-9642-008f3c1cf6dd", name: "Tarmogoyf" }]);
    } else {
      assert.deepEqual(migrated.cards, [], `${id}: a hypothetical-card case attaches none`);
    }
  }
});

test("readCaseFiles returns the raw files, without derived tags", async () => {
  const entries = await readCaseFiles(CASES_DIR);
  assert.ok(entries.length >= 18);
  for (const { case: raw } of entries) {
    assert.equal(Object.hasOwn(raw, "tags"), false);
  }
});

test("loadSnapshotSources reads the committed rule index, card oracle text and rulings, and hashes the whole index file", async () => {
  const { loadSnapshotSources } = await import("./gold-cases.mjs");
  const sources = await loadSnapshotSources();
  assert.match(sources.ruleIndexHash, /^[0-9a-f]{64}$/);
  assert.match(sources.ruleText("510.1c"), /^510\.1c/);
  assert.equal(sources.ruleText("999.999"), null);
  const tarmogoyf = "45900b2f-f6a9-4c42-9642-008f3c1cf6dd";
  assert.match(sources.oracleText(tarmogoyf), /Tarmogoyf's power/);
  assert.ok(sources.rulings(tarmogoyf).length > 0);
  assert.deepEqual(sources.rulings("00000000-0000-0000-0000-000000000000"), []);
});

// ---------------------------------------------------------------------------
// External mode: the local practice suite (REQ-232). Invented questions only.
// ---------------------------------------------------------------------------

function validSuiteCase(overrides = {}) {
  return {
    ...validTier1Case({ id: "suite-sample-1", question: "An invented practice question?" }),
    tier: "external",
    expected: { outcome: null, shortAnswer: "Invented short answer.", answer: "Invented practice answer text.", decidingRuleIds: ["100.1"] },
    source: { authority: "external-unapproved", publisher: "Invented publisher", license: "used with permission, local only", questionId: 1 },
    suite: {
      name: "invented-suite",
      questionId: 1,
      level: 1,
      complexity: "simple",
      tags: ["Combat"],
      citedRuleIds: ["100.1"],
      ruleGroups: [["100.1"]],
      excluded: null
    },
    ...overrides
  };
}

test("default mode refuses a tier external case with the suite-folder message; external mode accepts it with a null outcome", () => {
  const suiteCase = validSuiteCase();
  const refused = validateGoldCase(suiteCase);
  assert.equal(refused.valid, false);
  assert.match(refused.errors.join("\n"), /suite cases belong only in the suite folder/);
  assert.deepEqual(validateGoldCase(suiteCase, { external: true }), { valid: true, errors: [] });
});

test("external mode refuses an approved case, a corpus tier, a missing suite block and a wrong authority", () => {
  const errorsOf = (entry) => validateGoldCase(entry, { external: true }).errors.join("\n");
  assert.match(errorsOf(validSuiteCase({ review: { status: "approved", reviewedOn: "2026-10-10" } })), /never approved by any path/);
  assert.match(errorsOf(validTier1Case({ id: "corpus-1" })), /accepts only "tier": "external"/);
  const withoutSuite = validSuiteCase();
  delete withoutSuite.suite;
  assert.match(errorsOf(withoutSuite), /needs a "suite" block/);
  assert.match(errorsOf(validSuiteCase({ source: { authority: "wotc-comprehensive-rules", publisher: "P", license: "L" } })), /external-unapproved/);
});

test("default mode still requires a real outcome", () => {
  const entry = validTier1Case();
  entry.expected.outcome = null;
  assert.equal(validateGoldCase(entry).valid, false);
});

test("loadGoldCases: default mode fails on a stray suite case; external mode loads it and ignores excluded duplicates", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gold-cases-ext-"));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (name, entry) => fs.writeFileSync(path.join(dir, name), JSON.stringify(entry), "utf8");

  write("a.case.json", validSuiteCase());
  await assert.rejects(() => loadGoldCases(dir), /suite cases belong only in the suite folder/);
  const loaded = await loadGoldCases(dir, { external: true });
  assert.equal(loaded.length, 1);
  assert.deepEqual(loaded[0].tags, ["mechanic:none", "cr:100"]);

  write("b.case.json", validSuiteCase({ id: "suite-sample-2", suite: { ...validSuiteCase().suite, questionId: 2, excluded: "duplicate-question" } }));
  assert.equal((await loadGoldCases(dir, { external: true })).length, 2, "an excluded twin is not a duplicate error");

  write("c.case.json", validSuiteCase({ id: "suite-sample-3" }));
  await assert.rejects(() => loadGoldCases(dir, { external: true }), /same question text as suite-sample-1/);
});
