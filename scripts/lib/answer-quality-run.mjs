// The case-selection, per-case merge and per-tier headline logic behind the
// on-demand answer-quality run (REQ-186 to REQ-190), kept as pure functions
// over plain data so they run under `node --test` with injected fakes, no
// TypeScript loader, no provider and no network. scripts/eval-answer-quality.mjs
// is the command that wires them to the corpus, the committed scores file and
// the live loop.
//
// A graded record is "judged against the current reference answer" only when
// it carries a reference-answer hash equal to the SHA-256 of the case's
// current `expected.answer`. Every record written before this change lacks
// both hashes, so each counts as ungraded and is selected by `--changed`: the
// first routine run after this change grades the 18 first-ship cases again.

import { sha256 } from "./gold-cases.mjs";

/** The tiers reported together as the "official" headline; tier 3 (the owner's own bucket) is never pooled with them. */
export const OFFICIAL_TIERS = [1, 2];

export function referenceAnswerHash(caseEntry) {
  return sha256(caseEntry.expected.answer);
}

export function hashPrompt(promptText) {
  return sha256(promptText);
}

export function promptKey(caseId, excerptCap) {
  return `${caseId}|${excerptCap}`;
}

export function findRecord(records, caseId, model, excerptCap) {
  return records.find((record) => record.caseId === caseId && record.model === model && record.excerptCap === excerptCap);
}

/** True for a case the run may grade at all: approved, and not flagged stale (REQ-225). */
export function isGradable(caseEntry, isStale) {
  return caseEntry.review.status === "approved" && !isStale(caseEntry);
}

/**
 * Why `--changed` would grade this case at this leg, or null when its last
 * record is current: never graded, a record with no prompt hash or no
 * reference-answer hash, a prompt that changed, or a reference answer that
 * changed while the prompt stayed identical.
 */
export function selectionReason(caseEntry, record, currentPromptHash) {
  if (!record) return "never graded";
  if (!record.promptHash) return "last record has no prompt hash";
  if (!record.referenceAnswerHash) return "last record has no reference-answer hash";
  if (currentPromptHash !== undefined && record.promptHash !== currentPromptHash) return "prompt changed";
  if (record.referenceAnswerHash !== referenceAnswerHash(caseEntry)) return "reference answer changed";
  return null;
}

// A small deterministic generator, so a seeded sample is the same sample on every machine.
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seeded sample of `count` items, stable for a given seed and input order. */
export function seededSample(items, count, seed) {
  const random = mulberry32(seed);
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** The label a selection mode records in the run metadata. */
export function describeSelectionMode(mode) {
  switch (mode.kind) {
    case "tag":
      return `tag:${mode.tag}`;
    case "tier":
      return `tier:${mode.tier}`;
    case "sample":
      return `sample:${mode.count}@${mode.seed}`;
    default:
      return mode.kind;
  }
}

/**
 * REQ-188: which cases a run grades. Only approved, non-stale cases are ever
 * candidates. `changed` (the default) takes a case when any leg's last record
 * is out of date (selectionReason); `all`, `tag`, `tier` and `sample` take
 * candidates directly. `promptHashes` maps `promptKey(caseId, cap)` to the
 * current prompt hash, and is consulted only by `changed`.
 */
export function selectCases({ cases, records, models, excerptCaps, mode, promptHashes = new Map(), isStale }) {
  const candidates = cases.filter((caseEntry) => isGradable(caseEntry, isStale));
  const skipped = {
    notApproved: cases.filter((caseEntry) => caseEntry.review.status !== "approved").length,
    stale: cases.filter((caseEntry) => caseEntry.review.status === "approved" && isStale(caseEntry)).length,
    current: 0
  };

  let chosen;
  if (mode.kind === "all") {
    chosen = candidates.map((caseEntry) => ({ caseEntry, reasons: ["all selected"] }));
  } else if (mode.kind === "tag") {
    chosen = candidates
      .filter((caseEntry) => (caseEntry.tags ?? []).includes(mode.tag))
      .map((caseEntry) => ({ caseEntry, reasons: [`tag ${mode.tag}`] }));
  } else if (mode.kind === "tier") {
    chosen = candidates
      .filter((caseEntry) => caseEntry.tier === mode.tier)
      .map((caseEntry) => ({ caseEntry, reasons: [`tier ${mode.tier}`] }));
  } else if (mode.kind === "sample") {
    const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
    chosen = seededSample(sorted, mode.count, mode.seed).map((caseEntry) => ({
      caseEntry,
      reasons: [`sample of ${mode.count}, seed ${mode.seed}`]
    }));
  } else {
    chosen = [];
    for (const caseEntry of candidates) {
      const reasons = [];
      for (const model of models) {
        for (const cap of excerptCaps) {
          const record = findRecord(records, caseEntry.id, model, cap);
          const reason = selectionReason(caseEntry, record, promptHashes.get(promptKey(caseEntry.id, cap)));
          if (reason) reasons.push(`${reason} (${model}, cap ${cap})`);
        }
      }
      if (reasons.length > 0) chosen.push({ caseEntry, reasons });
      else skipped.current += 1;
    }
  }
  return { selected: chosen, skipped, candidates };
}

/**
 * REQ-189: merges a run's fresh per-case records into the committed file's
 * records. A fresh record replaces the previous record for the same case, model
 * and cap; every other case's record is kept unchanged. A previous record is
 * dropped only when its case left the corpus or is no longer `approved`. A
 * stale case's record stays (it is merely not counted, see computeHeadline).
 */
export function mergeCaseLegScores({ previous, fresh, cases }) {
  const approvedIds = new Set(cases.filter((caseEntry) => caseEntry.review.status === "approved").map((c) => c.id));
  const replaced = new Set(fresh.map((record) => `${record.caseId}|${record.model}|${record.excerptCap}`));
  const kept = previous.filter(
    (record) => approvedIds.has(record.caseId) && !replaced.has(`${record.caseId}|${record.model}|${record.excerptCap}`)
  );
  return [...kept, ...fresh].sort(
    (a, b) => a.caseId.localeCompare(b.caseId) || a.model.localeCompare(b.model) || a.excerptCap - b.excerptCap
  );
}

function emptyCounts() {
  return { fullyCorrect: 0, graded: 0, ungraded: 0 };
}

/**
 * REQ-187: the headline for one answer model at one excerpt cap. Over approved,
 * non-stale cases only, split into the official tiers (1 and 2 together) and
 * tier 3 (never pooled with them). A case counts through its record for this
 * leg only when that record was judged against the case's current reference
 * answer; every other case is ungraded. A stale approved case is left out of
 * the count and shown in `stale`.
 */
export function computeHeadline({ cases, records, isStale, model, excerptCap }) {
  const approved = cases.filter((caseEntry) => caseEntry.review.status === "approved");
  const headline = { official: emptyCounts(), tier3: emptyCounts(), stale: 0 };
  for (const caseEntry of approved) {
    if (isStale(caseEntry)) {
      headline.stale += 1;
      continue;
    }
    const group = caseEntry.tier === 3 ? headline.tier3 : headline.official;
    const record = findRecord(records, caseEntry.id, model, excerptCap);
    if (!record || !record.referenceAnswerHash || record.referenceAnswerHash !== referenceAnswerHash(caseEntry)) {
      group.ungraded += 1;
      continue;
    }
    group.graded += 1;
    if (!record.undetermined && record.scores?.correctness === 2) group.fullyCorrect += 1;
  }
  return headline;
}

/** One printed headline line, such as `gpt-4.1 at cap 10 -- tiers 1-2: 14/16 fully correct (2 ungraded, 0 stale); tier 3: none approved`. */
export function formatHeadline({ model, excerptCap, headline }) {
  const { official, tier3, stale } = headline;
  const officialText = `tiers 1-2: ${official.fullyCorrect}/${official.graded} fully correct (${official.ungraded} ungraded, ${stale} stale)`;
  const tier3Total = tier3.graded + tier3.ungraded;
  const tier3Text =
    tier3Total === 0
      ? "tier 3: none approved"
      : `tier 3: ${tier3.fullyCorrect}/${tier3.graded} fully correct (${tier3.ungraded} ungraded)`;
  return `${model} at cap ${excerptCap} -- ${officialText}; ${tier3Text}`;
}
