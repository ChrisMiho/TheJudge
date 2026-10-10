// Shared rules-test-case loader and validator, format version 2 (REQ-185).
//
// Every reader of the rules test corpus -- the retrieval check
// (scripts/eval-worked-solutions.mjs), the answer-quality run
// (scripts/eval-answer-quality.mjs), and the offline gate, coverage gate,
// review commands and staleness report built on top of them -- reads cases
// through this one module, so no two of them diverge into separate readers of
// the same committed files. Backend TypeScript tests reach it through the
// sibling declaration `gold-cases.d.mts`, never a second copy.
//
// A case is valid only when it carries: `id`; `formatVersion` 2; `tier` 1, 2
// or 3; `review` (a status of `draft`, `approved`, `needs-edit` or
// `rejected`, plus `reviewedOn`, required once a case is not a draft); the
// attached `cards`; a `gameState` (null, or an In-Depth game context whose
// structural rules this loader checks); a non-empty `question`; `expected`
// (`outcome`, a one-line `shortAnswer`, the reference `answer` and at least
// one `decidingRuleIds` entry); a `source` block naming the authority, the
// publisher, the licence and the citation its tier requires; `layers`; a
// `snapshot` of content hashes; and a non-empty `whyHard`. A malformed case
// fails loudly -- loadGoldCases() throws, naming every problem -- rather than
// silently scoring as a retrieval miss.
//
// Tags and difficulty are derived here, never hand-written: the loader
// refuses a case file that carries them. Whether a case is stale -- the rule,
// oracle or ruling text it depends on changed after it was authored or last
// approved -- is decided by one function, compareSnapshot(), that the live
// runner, the review render and the staleness report all call.
//
// The full In-Depth schema check on `gameState` is TypeScript
// (apps/backend/src/validation/askAiRequest.ts) and is run by a backend test;
// this plain-JavaScript loader checks only the structural rules.

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CASES_DIR = join(repoRoot, "apps/backend/src/eval/worked-solutions");
export const DATA_DIR = join(repoRoot, "apps/backend/data");

export const CASE_FORMAT_VERSION = 2;
export const REVIEW_STATUSES = ["draft", "approved", "needs-edit", "rejected"];
export const OUTCOMES = ["works", "does-not-work", "depends"];
export const ZONE_IDS = ["stack", "battlefield", "hand", "graveyard", "exile", "library", "command"];
export const SNAPSHOT_DEPENDENCIES = ["rules", "oracle", "rulings"];
/**
 * The authored block a case came from, an optional `source.pool` the coverage
 * report counts by: one case per real mechanic, a hard-area case built from an
 * unused Comprehensive Rules `Example:` line, one built from a WotC ruling that
 * names a second card, or one of the owner's tester cases. A case without it
 * (the 18 first-ship cases) belongs to no pool.
 */
export const SOURCE_POOLS = ["mechanic", "cr-example", "two-card-ruling", "tester"];

/**
 * The local practice suite (REQ-232) shares this format but is its own kind:
 * `tier` "external", never approved, answered by an unapproved outside
 * source. It is read only in the loader's external mode, from the suite
 * folder; the default mode every corpus reader uses refuses it.
 */
export const EXTERNAL_TIER = "external";
export const EXTERNAL_AUTHORITY = "external-unapproved";

/** The answer authority each tier's `source.authority` must name. */
export const TIER_AUTHORITIES = {
  1: "wotc-comprehensive-rules",
  2: "wotc-card-ruling",
  3: "owner-approved-derived"
};

/**
 * The six worked-solution cases already committed before this package;
 * REQ-185 requires the corpus to hold at least these, each tier 1.
 */
export const REQUIRED_SIX_CASE_IDS = [
  "delayed-trigger-created-too-late",
  "illegal-target-partial-resolution",
  "last-known-information-simultaneous-sba",
  "layers-timestamp-order",
  "replacement-effect-single-application",
  "state-based-actions-mid-resolution"
];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((entry) => isNonEmptyString(entry));
}

const SHA256_HEX = /^[0-9a-f]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Structural rules for a case's `gameState` (A15). It is null or an In-Depth
 * game context; the prompt prints `owner:` only for a card outside the stack
 * and `caster:` only for a stack item, so a fact set where it is never
 * printed would be one no check can see. Every card in a zone must be one of
 * the case's attached `cards`, and every attached card must sit in a zone, so
 * an In-Depth request carries exactly the cards the case names.
 */
function validateGameState(gameState, cards, id) {
  const errors = [];
  if (gameState === null) return errors;
  if (!isPlainObject(gameState)) {
    errors.push(`${id}: "gameState" must be null or an object`);
    return errors;
  }
  const zones = gameState.zones;
  if (zones !== undefined && !isPlainObject(zones)) {
    errors.push(`${id}: gameState.zones must be an object`);
    return errors;
  }
  const cardIds = new Set(cards.map((card) => card?.oracleId));
  const placed = new Set();
  for (const [zoneId, items] of Object.entries(zones ?? {})) {
    if (!ZONE_IDS.includes(zoneId)) {
      errors.push(`${id}: gameState.zones has unknown zone "${zoneId}"`);
      continue;
    }
    if (!Array.isArray(items)) {
      errors.push(`${id}: gameState.zones.${zoneId} must be an array`);
      continue;
    }
    items.forEach((item, index) => {
      const where = `gameState.zones.${zoneId}[${index}]`;
      if (!isPlainObject(item)) {
        errors.push(`${id}: ${where} must be an object`);
        return;
      }
      if (zoneId === "stack" && item.owner !== undefined) {
        errors.push(
          `${id}: ${where} sets "owner" on a stack item; the prompt prints owner only outside the stack -- put the fact in "contextNotes"`
        );
      }
      if (zoneId !== "stack" && item.caster !== undefined) {
        errors.push(
          `${id}: ${where} sets "caster" on a card outside the stack; the prompt prints caster only on stack items -- put the fact in "contextNotes"`
        );
      }
      if (!isNonEmptyString(item.cardId)) {
        errors.push(`${id}: ${where} needs a non-empty "cardId" (the card's oracle id)`);
      } else if (!cardIds.has(item.cardId)) {
        errors.push(`${id}: ${where} cardId ${item.cardId} is not in "cards"`);
      } else {
        placed.add(item.cardId);
      }
    });
  }
  for (const card of cards) {
    if (isNonEmptyString(card?.oracleId) && !placed.has(card.oracleId)) {
      errors.push(`${id}: attached card ${card.name ?? card.oracleId} is in "cards" but in no gameState zone`);
    }
  }
  return errors;
}

/** The `suite` block a local practice-suite case carries (REQ-232); required in external mode. */
function validateSuiteBlock(suite, id) {
  const errors = [];
  if (!isPlainObject(suite)) {
    errors.push(`${id}: external mode needs a "suite" block`);
    return errors;
  }
  if (!isNonEmptyString(suite.name)) errors.push(`${id}: suite.name must be non-empty`);
  if (suite.questionId === undefined || suite.questionId === null) errors.push(`${id}: suite.questionId is required`);
  if (suite.level === undefined || suite.level === null) errors.push(`${id}: suite.level is required`);
  if (!isNonEmptyString(suite.complexity)) errors.push(`${id}: suite.complexity must be non-empty`);
  if (!Array.isArray(suite.tags)) errors.push(`${id}: suite.tags must be an array`);
  if (!Array.isArray(suite.citedRuleIds)) errors.push(`${id}: suite.citedRuleIds must be an array`);
  if (!Array.isArray(suite.ruleGroups)) errors.push(`${id}: suite.ruleGroups must be an array`);
  if (suite.excluded !== null && !isNonEmptyString(suite.excluded)) {
    errors.push(`${id}: suite.excluded must be null or a reason string`);
  }
  return errors;
}

/**
 * Validates one rules test case object against format version 2. Returns an
 * explicit `{ valid, errors }` result -- never a silent pass -- so a caller
 * can fail loudly rather than treat a malformed case as a retrieval miss.
 */
export function validateGoldCase(caseEntry, { external = false } = {}) {
  const errors = [];
  const id = isNonEmptyString(caseEntry?.id) ? caseEntry.id : "<missing id>";

  if (!isNonEmptyString(caseEntry?.id)) {
    errors.push(`${id}: missing non-empty "id"`);
  }
  if (caseEntry?.formatVersion !== CASE_FORMAT_VERSION) {
    errors.push(`${id}: "formatVersion" must be ${CASE_FORMAT_VERSION}, got ${JSON.stringify(caseEntry?.formatVersion)}`);
  }
  if (external) {
    if (caseEntry?.tier !== EXTERNAL_TIER) {
      errors.push(`${id}: external mode accepts only "tier": "${EXTERNAL_TIER}" cases, got ${JSON.stringify(caseEntry?.tier)}`);
    }
    errors.push(...validateSuiteBlock(caseEntry?.suite, id));
  } else if (caseEntry?.tier === EXTERNAL_TIER) {
    errors.push(
      `${id}: "tier": "${EXTERNAL_TIER}" marks a local practice-suite case; suite cases belong only in the suite folder (REQ-232), never in the rules test corpus`
    );
  } else if (![1, 2, 3].includes(caseEntry?.tier)) {
    errors.push(`${id}: "tier" must be 1, 2 or 3, got ${JSON.stringify(caseEntry?.tier)}`);
  }
  for (const derived of ["tags", "difficulty"]) {
    if (caseEntry && Object.hasOwn(caseEntry, derived)) {
      errors.push(`${id}: "${derived}" is derived by the loader and must not be written in a case file`);
    }
  }

  const review = caseEntry?.review;
  if (!isPlainObject(review)) {
    errors.push(`${id}: missing "review" block`);
  } else {
    if (!REVIEW_STATUSES.includes(review.status)) {
      errors.push(`${id}: review.status must be one of ${REVIEW_STATUSES.join(", ")}, got ${JSON.stringify(review.status)}`);
    }
    if (review.reviewedOn !== null && review.reviewedOn !== undefined && !ISO_DATE.test(String(review.reviewedOn))) {
      errors.push(`${id}: review.reviewedOn must be null or a YYYY-MM-DD date`);
    }
    if (external && review.status !== "draft") {
      errors.push(`${id}: a suite case is never approved by any path; review.status must be "draft", got ${JSON.stringify(review.status)}`);
    }
    if (REVIEW_STATUSES.includes(review.status) && review.status !== "draft" && !ISO_DATE.test(String(review.reviewedOn ?? ""))) {
      errors.push(`${id}: review.reviewedOn is required once a case is not a draft`);
    }
    if (review.note !== undefined && typeof review.note !== "string") {
      errors.push(`${id}: review.note must be a string when present`);
    }
  }

  const cards = Array.isArray(caseEntry?.cards) ? caseEntry.cards : null;
  if (cards === null) {
    errors.push(`${id}: "cards" must be an array (empty when the question names no real card)`);
  } else {
    const seen = new Set();
    cards.forEach((card, index) => {
      if (!isNonEmptyString(card?.oracleId) || !isNonEmptyString(card?.name)) {
        errors.push(`${id}: cards[${index}] needs a non-empty "oracleId" and "name"`);
      } else if (seen.has(card.oracleId)) {
        errors.push(`${id}: cards[${index}] repeats oracle id ${card.oracleId}`);
      } else {
        seen.add(card.oracleId);
      }
    });
  }

  if (caseEntry?.gameState === undefined) {
    errors.push(`${id}: missing "gameState" (null when the ruling does not depend on game state)`);
  } else {
    errors.push(...validateGameState(caseEntry.gameState, cards ?? [], id));
  }

  if (!isNonEmptyString(caseEntry?.question)) {
    errors.push(`${id}: missing non-empty "question"`);
  }

  const expected = caseEntry?.expected;
  if (!isPlainObject(expected)) {
    errors.push(`${id}: missing "expected" block`);
  } else {
    if (external && expected.outcome === null) {
      // The external source gives no works / does-not-work label; outcome is a review aid the judge never sees.
    } else if (!OUTCOMES.includes(expected.outcome)) {
      errors.push(`${id}: expected.outcome must be one of ${OUTCOMES.join(", ")}, got ${JSON.stringify(expected.outcome)}`);
    }
    if (!isNonEmptyString(expected.shortAnswer)) {
      errors.push(`${id}: missing non-empty "expected.shortAnswer"`);
    }
    if (!isNonEmptyString(expected.answer)) {
      errors.push(`${id}: missing non-empty "expected.answer"`);
    }
    // An excluded suite case is kept on disk but never selected, so it may have no deciding rule (no-cited-rule, unknown-rule).
    const mayLackRules = external && isNonEmptyString(caseEntry?.suite?.excluded);
    if (!Array.isArray(expected.decidingRuleIds) || (expected.decidingRuleIds.length === 0 && !mayLackRules)) {
      errors.push(`${id}: needs at least one "expected.decidingRuleIds" entry`);
    } else if (!isStringArray(expected.decidingRuleIds)) {
      errors.push(`${id}: expected.decidingRuleIds entries must be non-empty strings`);
    }
  }

  if (!isNonEmptyString(caseEntry?.whyHard)) {
    errors.push(`${id}: missing non-empty "whyHard"`);
  }

  const source = caseEntry?.source;
  if (!isPlainObject(source)) {
    errors.push(`${id}: missing "source" block`);
  } else {
    if (!isNonEmptyString(source.authority)) {
      errors.push(`${id}: source.authority must be non-empty`);
    } else if (external) {
      if (source.authority !== EXTERNAL_AUTHORITY) {
        errors.push(`${id}: a suite case source.authority must be "${EXTERNAL_AUTHORITY}"`);
      }
    } else if ([1, 2, 3].includes(caseEntry?.tier) && source.authority !== TIER_AUTHORITIES[caseEntry.tier]) {
      errors.push(`${id}: a tier ${caseEntry.tier} source.authority must be "${TIER_AUTHORITIES[caseEntry.tier]}"`);
    }
    if (!isNonEmptyString(source.publisher)) {
      errors.push(`${id}: source.publisher must be non-empty`);
    }
    if (!isNonEmptyString(source.license)) {
      errors.push(`${id}: source.license must be non-empty`);
    }
    if (source.pool !== undefined && !SOURCE_POOLS.includes(source.pool)) {
      errors.push(`${id}: source.pool must be one of ${SOURCE_POOLS.join(", ")} when present, got ${JSON.stringify(source.pool)}`);
    }
    if (caseEntry?.tier === 1) {
      if (!isNonEmptyString(source.ruleId)) {
        errors.push(`${id}: tier 1 source needs a non-empty "ruleId" citation`);
      }
    } else if (caseEntry?.tier === 2) {
      if (!isNonEmptyString(source.cardName)) {
        errors.push(`${id}: tier 2 source needs a non-empty "cardName" citation`);
      }
      if (!isNonEmptyString(source.oracleId)) {
        errors.push(`${id}: tier 2 source needs a non-empty "oracleId" citation`);
      }
      if (!isNonEmptyString(source.rulingDate)) {
        errors.push(`${id}: tier 2 source needs a non-empty "rulingDate" citation`);
      }
    } else if (caseEntry?.tier === 3) {
      if (!isNonEmptyString(source.citation)) {
        errors.push(`${id}: tier 3 source needs a non-empty "citation" (a rule id per reasoning step)`);
      }
      if (!isStringArray(source.research) || source.research.length === 0) {
        errors.push(`${id}: tier 3 source needs a non-empty "research" list`);
      }
    }
  }

  const layers = caseEntry?.layers;
  if (!isPlainObject(layers)) {
    errors.push(`${id}: missing "layers" block`);
  } else {
    for (const key of ["requiredFacts", "irrelevantFacts", "variants"]) {
      if (!Array.isArray(layers[key])) errors.push(`${id}: layers.${key} must be an array`);
    }
  }

  const snapshot = caseEntry?.snapshot;
  if (!isPlainObject(snapshot)) {
    errors.push(`${id}: missing "snapshot" block`);
  } else {
    if (!SHA256_HEX.test(String(snapshot.ruleIndexHash ?? ""))) {
      errors.push(`${id}: snapshot.ruleIndexHash must be a SHA-256 hex string`);
    }
    const depends = snapshot.dependsOnHashes;
    if (!isPlainObject(depends)) {
      errors.push(`${id}: missing "snapshot.dependsOnHashes"`);
    } else {
      for (const key of SNAPSHOT_DEPENDENCIES) {
        if (!SHA256_HEX.test(String(depends[key] ?? ""))) {
          errors.push(`${id}: snapshot.dependsOnHashes.${key} must be a SHA-256 hex string`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Distinct 701/702 mechanic prefixes among a case's deciding rule ids, such as `702.19` for `702.19b`. */
export function mechanicPrefixes(decidingRuleIds) {
  const prefixes = new Set();
  for (const ruleId of decidingRuleIds ?? []) {
    const match = /^(70[12]\.\d+)/.exec(ruleId);
    if (match) prefixes.add(match[1]);
  }
  return [...prefixes];
}

/** Distinct three-digit rules sections among a case's deciding rule ids, such as `510` for `510.1c`. */
export function ruleSections(decidingRuleIds) {
  const sections = new Set();
  for (const ruleId of decidingRuleIds ?? []) {
    const match = /^(\d{3})/.exec(ruleId);
    if (match) sections.add(match[1]);
  }
  return [...sections];
}

const LAYERS_SECTION = "613";
const REPLACEMENT_SECTIONS = ["614", "615", "616"];
const MULTIPLAYER_SECTIONS = ["801", "802", "803", "804", "805", "806", "807", "808", "809", "810"];

/**
 * Tags are derived, never hand-written (REQ-185): `mechanic:` from the 701/702
 * ids in `decidingRuleIds` (`mechanic:none` when there are none), `cr:` from
 * every deciding rules section.
 */
export function deriveTags(caseEntry) {
  const ruleIds = caseEntry?.expected?.decidingRuleIds ?? [];
  const mechanics = mechanicPrefixes(ruleIds);
  const tags = mechanics.length > 0 ? mechanics.map((prefix) => `mechanic:${prefix}`) : ["mechanic:none"];
  for (const section of ruleSections(ruleIds)) tags.push(`cr:${section}`);
  return tags;
}

/**
 * Difficulty is derived from the number of attached cards and distinct rules
 * sections, plus flags for layers, replacement effects and multiplayer.
 */
export function deriveDifficulty(caseEntry) {
  const sections = ruleSections(caseEntry?.expected?.decidingRuleIds ?? []);
  const flags = [];
  if (sections.includes(LAYERS_SECTION)) flags.push("layers");
  if (sections.some((section) => REPLACEMENT_SECTIONS.includes(section))) flags.push("replacement");
  if (sections.some((section) => MULTIPLAYER_SECTIONS.includes(section))) flags.push("multiplayer");
  const cardCount = caseEntry?.cards?.length ?? 0;
  return { cardCount, sectionCount: sections.length, flags, score: cardCount + sections.length + flags.length };
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function normalizeQuestion(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Duplicate checks across a set of cases: the same id, the same question text,
 * or the same set of attached cards with the same answer source (a second case
 * on the same cards must test a different interaction, so a rewording is a
 * future `layers.variants` entry, not a new case).
 */
export function findDuplicateErrors(cases) {
  const errors = [];
  const ids = new Map();
  const questions = new Map();
  const answerSources = new Map();
  for (const caseEntry of cases) {
    if (ids.has(caseEntry.id)) errors.push(`${caseEntry.id}: duplicate id (also ${ids.get(caseEntry.id)})`);
    else ids.set(caseEntry.id, caseEntry.id);

    const questionKey = normalizeQuestion(caseEntry.question);
    if (questions.has(questionKey)) errors.push(`${caseEntry.id}: same question text as ${questions.get(questionKey)}`);
    else questions.set(questionKey, caseEntry.id);

    const cardKey = (caseEntry.cards ?? [])
      .map((card) => card.oracleId)
      .sort()
      .join(",");
    const answerKey = `${cardKey}|${sha256(String(caseEntry.expected?.answer ?? ""))}`;
    const sourceKey = caseEntry.tier === 2 ? `${cardKey}|ruling|${caseEntry.source?.rulingDate ?? ""}|${answerKey}` : answerKey;
    if (answerSources.has(sourceKey)) {
      errors.push(`${caseEntry.id}: same attached cards and answer source as ${answerSources.get(sourceKey)}`);
    } else {
      answerSources.set(sourceKey, caseEntry.id);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Snapshot hashing and the one stale comparison (REQ-185, REQ-225)
// ---------------------------------------------------------------------------

/**
 * Reads the committed data a snapshot hashes, and returns accessor functions
 * over it -- the "sources" every snapshot function takes, so tests inject
 * small in-memory sources and never read the 2 MB index. `ruleIndexHash` is
 * the SHA-256 of the whole rule-index file: the committed index carries no
 * Comprehensive Rules date, so the file's hash stands in for one.
 */
export async function loadSnapshotSources({ dataDir = DATA_DIR } = {}) {
  const ruleIndexBytes = await readFile(join(dataDir, "gameRulesRuleIndex.json"));
  const ruleIndex = JSON.parse(ruleIndexBytes.toString("utf8"));
  const ruleTextById = new Map();
  for (const entry of ruleIndex) {
    if (typeof entry?.ruleId === "string") ruleTextById.set(entry.ruleId, entry.text);
  }
  const cardDetail = JSON.parse(brotliDecompressSync(await readFile(join(dataDir, "cardDetailByOracleId.json.br"))).toString("utf8"));
  const cardRulings = JSON.parse(brotliDecompressSync(await readFile(join(dataDir, "cardRulingsByOracleId.json.br"))).toString("utf8"));
  return {
    ruleIndexHash: createHash("sha256").update(ruleIndexBytes).digest("hex"),
    ruleIndex,
    ruleText: (ruleId) => ruleTextById.get(ruleId) ?? null,
    oracleText: (oracleId) => cardDetail[oracleId]?.oracleText ?? null,
    rulings: (oracleId) =>
      (cardRulings[oracleId] ?? []).map((ruling) => ({ publishedAt: ruling.publishedAt, comment: ruling.comment }))
  };
}

/**
 * The committed text a case depends on, as read now: the rule text of every
 * deciding rule id, the oracle text of every attached card, and every ruling
 * of every attached card. The review render shows this text; the snapshot
 * hashes it. Order is canonical (sorted ids) so a hash never depends on the
 * order a case lists them.
 */
export function collectDependencyTexts(caseEntry, sources) {
  const ruleIds = [...new Set(caseEntry.expected.decidingRuleIds)].sort();
  const cards = [...caseEntry.cards].sort((a, b) => a.oracleId.localeCompare(b.oracleId));
  return {
    rules: ruleIds.map((ruleId) => ({ ruleId, text: sources.ruleText(ruleId) })),
    oracle: cards.map((card) => ({ oracleId: card.oracleId, name: card.name, text: sources.oracleText(card.oracleId) })),
    rulings: cards.map((card) => ({ oracleId: card.oracleId, name: card.name, rulings: sources.rulings(card.oracleId) }))
  };
}

/** SHA-256 hashes of the rule, oracle and ruling text a case depends on, read from `sources` now. */
export function computeDependsOnHashes(caseEntry, sources) {
  const texts = collectDependencyTexts(caseEntry, sources);
  return {
    rules: sha256(JSON.stringify(texts.rules.map(({ ruleId, text }) => [ruleId, text]))),
    oracle: sha256(JSON.stringify(texts.oracle.map(({ oracleId, text }) => [oracleId, text]))),
    rulings: sha256(
      JSON.stringify(
        texts.rulings.map(({ oracleId, rulings }) => [oracleId, rulings.map((ruling) => [ruling.publishedAt, ruling.comment])])
      )
    )
  };
}

/** The `snapshot` block a case records when it is authored and each time the owner approves it. */
export function computeSnapshot(caseEntry, sources) {
  return { ruleIndexHash: sources.ruleIndexHash, dependsOnHashes: computeDependsOnHashes(caseEntry, sources) };
}

/**
 * The one stale comparison (A18): does a case's stored `snapshot` still match
 * the committed data? Returns `{ stale, changed }`, where `changed` names each
 * dependency (`rules`, `oracle`, `rulings`) whose hash differs. The whole-file
 * `ruleIndexHash` is recorded for provenance but is not itself a stale
 * trigger: a Comprehensive Rules refresh that leaves a case's own rules
 * untouched must not flag every case.
 */
export function compareSnapshot(caseEntry, sources) {
  const stored = caseEntry.snapshot?.dependsOnHashes ?? {};
  const current = computeDependsOnHashes(caseEntry, sources);
  const changed = SNAPSHOT_DEPENDENCIES.filter((dependency) => stored[dependency] !== current[dependency]);
  return { stale: changed.length > 0, changed };
}

// ---------------------------------------------------------------------------
// Reading the corpus
// ---------------------------------------------------------------------------

/** Reads every `*.case.json` file in the corpus directory, sorted by filename, unvalidated. */
export async function readCaseFiles(casesDir = CASES_DIR) {
  const fileNames = (await readdir(casesDir)).filter((name) => name.endsWith(".case.json")).sort();
  const entries = [];
  for (const fileName of fileNames) {
    const parsed = JSON.parse(await readFile(join(casesDir, fileName), "utf8"));
    entries.push({ fileName, case: parsed });
  }
  return entries;
}

/**
 * Loads and validates every case in `casesDir`, rejecting duplicates, and
 * returns each case with its derived `tags` and `difficulty` added. Throws,
 * naming every invalid case and its errors, rather than returning a malformed
 * case that would silently score as a miss downstream. A writer must read raw
 * files with readCaseFiles(), not write back what this returns.
 *
 * Default mode is the corpus reader and refuses a `tier: "external"` case.
 * `{ external: true }` is the suite reader (REQ-232): it accepts only external
 * draft cases that carry a `suite` block.
 */
export async function loadGoldCases(casesDir = CASES_DIR, { external = false } = {}) {
  const entries = await readCaseFiles(casesDir);
  const problems = [];
  const cases = [];
  for (const { fileName, case: caseEntry } of entries) {
    const { valid, errors } = validateGoldCase(caseEntry, { external });
    if (!valid) {
      problems.push(`${fileName}: ${errors.join("; ")}`);
    } else {
      cases.push({ ...caseEntry, tags: deriveTags(caseEntry), difficulty: deriveDifficulty(caseEntry) });
    }
  }
  // Excluded suite cases are kept on disk but never selected, so they are not checked for duplicates.
  problems.push(...findDuplicateErrors(external ? cases.filter((caseEntry) => !caseEntry.suite?.excluded) : cases));
  if (problems.length > 0) {
    throw new Error(`Invalid gold case(s):\n${problems.join("\n")}`);
  }
  return cases;
}
