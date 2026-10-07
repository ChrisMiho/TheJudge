// The owner review flow's logic (REQ-224): render pending rules test cases into
// batches the owner can read and fill in, and apply the filled batch's verdicts
// back into the case files. Pure functions over plain data and injected
// snapshot sources, so they run under `node --test` with fakes -- no file
// system, no TypeScript loader, no provider, no network. The commands in
// scripts/rules-review.mjs wire them to the corpus and the output folder.
//
// Pending means every `draft` case, every `approved` case the stale comparison
// (compareSnapshot, scripts/lib/gold-cases.mjs) flags, and on request every
// `needs-edit` case. A rejected case is never rendered. Batches are grouped by
// mechanic, then by rules section.
//
// A batch is one Markdown file. Each case is a block under a `## <id>` heading
// with a hidden fingerprint comment and, last, two slots the owner fills in:
//
//   >>> Verdict: approve | reject | edit
//   >>> Note: one line (required for edit)
//
// The fingerprint records the hashes of the question, the reference answer and
// the committed rule, oracle and ruling text as they were when the batch was
// rendered. Apply refuses a case whose question or answer changed since, or
// whose committed text changed since, so the owner never approves text they did
// not see. Apply writes only `review.*`, and on `approve` re-records `snapshot`:
// it is the only command that writes `snapshot` after a case is authored (the
// 18 first-ship cases' migration counts as their authoring).

import {
  SNAPSHOT_DEPENDENCIES,
  collectDependencyTexts,
  compareSnapshot,
  computeDependsOnHashes,
  computeSnapshot,
  sha256,
  validateGoldCase
} from "./gold-cases.mjs";

export const DEFAULT_BATCH_SIZE = 25;
export const VERDICTS = ["approve", "reject", "edit"];
const FINGERPRINT_PREFIX = "<!-- rules-review:case ";
const FINGERPRINT_SUFFIX = " -->";
const VERDICT_SLOT = ">>> Verdict:";
const NOTE_SLOT = ">>> Note:";

/** The hashes a batch records for a case when it is rendered, and apply checks against the committed data. */
export function caseFingerprint(caseEntry, sources) {
  const depends = computeDependsOnHashes(caseEntry, sources);
  return {
    id: caseEntry.id,
    question: sha256(caseEntry.question),
    answer: sha256(caseEntry.expected.answer),
    rules: depends.rules,
    oracle: depends.oracle,
    rulings: depends.rulings
  };
}

/** Every case that needs the owner's eye, each with its stale comparison result. */
export function pendingCases({ cases, sources, includeNeedsEdit = false }) {
  const pending = [];
  for (const caseEntry of cases) {
    const status = caseEntry.review.status;
    if (status === "draft" || (includeNeedsEdit && status === "needs-edit")) {
      pending.push({ caseEntry, stale: { stale: false, changed: [] } });
    } else if (status === "approved") {
      const stale = compareSnapshot(caseEntry, sources);
      if (stale.stale) pending.push({ caseEntry, stale });
    }
  }
  return pending;
}

function mechanicOf(caseEntry) {
  const tag = (caseEntry.tags ?? []).find((candidate) => candidate.startsWith("mechanic:") && candidate !== "mechanic:none");
  return tag ? tag.slice("mechanic:".length) : null;
}

function sectionOf(caseEntry) {
  const tag = (caseEntry.tags ?? []).find((candidate) => candidate.startsWith("cr:"));
  return tag ? tag.slice("cr:".length) : "";
}

function numericKey(value) {
  return value.split(".").map((part) => part.padStart(6, "0")).join(".");
}

/** Grouped by mechanic (a case with no mechanic last), then by rules section, then by id. */
export function sortForReview(entries) {
  return [...entries].sort((a, b) => {
    const mechanicA = mechanicOf(a.caseEntry);
    const mechanicB = mechanicOf(b.caseEntry);
    if (mechanicA !== mechanicB) {
      if (mechanicA === null) return 1;
      if (mechanicB === null) return -1;
      return numericKey(mechanicA).localeCompare(numericKey(mechanicB));
    }
    const sectionA = sectionOf(a.caseEntry);
    const sectionB = sectionOf(b.caseEntry);
    if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
    return a.caseEntry.id.localeCompare(b.caseEntry.id);
  });
}

function quote(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function renderDependencyText(dependency, texts) {
  if (dependency === "rules") {
    return texts.rules.map((rule) => `Rule ${rule.ruleId}\n${quote(rule.text ?? "(not in the committed rule index)")}`).join("\n\n");
  }
  if (dependency === "oracle") {
    return texts.oracle.map((card) => `${card.name}\n${quote(card.text ?? "(no committed oracle text)")}`).join("\n\n");
  }
  return texts.rulings
    .map((card) => {
      const lines = card.rulings.map((ruling) => `- ${ruling.publishedAt}: ${ruling.comment}`);
      return `${card.name}\n${quote(lines.length > 0 ? lines.join("\n") : "(no committed rulings)")}`;
    })
    .join("\n\n");
}

/** One case's block in a batch: everything the owner needs to decide, then the verdict slots. */
export function renderCaseEntry({ caseEntry, stale }, sources, position, total) {
  const texts = collectDependencyTexts(caseEntry, sources);
  const mechanic = mechanicOf(caseEntry);
  const lines = [
    `## ${caseEntry.id}`,
    `${FINGERPRINT_PREFIX}${JSON.stringify(caseFingerprint(caseEntry, sources))}${FINGERPRINT_SUFFIX}`,
    "",
    `Case ${position} of ${total} in this batch. Tier ${caseEntry.tier}; review status now: ${caseEntry.review.status}; outcome: ${caseEntry.expected.outcome}; mechanic: ${mechanic ?? "none"}; rules section: ${sectionOf(caseEntry) || "none"}.`
  ];
  if (stale.stale) {
    lines.push(
      "",
      `STALE: this case was approved against committed text that has since changed (${stale.changed.join(", ")}). It is out of live grading until you approve it again. What the committed data says now:`
    );
    for (const dependency of stale.changed) {
      lines.push("", `Changed ${dependency} text:`, renderDependencyText(dependency, texts));
    }
  }
  if (caseEntry.review.note) lines.push("", `Last review note: ${caseEntry.review.note}`);
  lines.push("", "Question:", quote(caseEntry.question));
  lines.push("", `Attached cards: ${caseEntry.cards.length === 0 ? "none" : caseEntry.cards.map((card) => card.name).join(", ")}`);
  for (const card of texts.oracle) lines.push("", `${card.name} (oracle text):`, quote(card.text ?? "(no committed oracle text)"));
  if (caseEntry.gameState) lines.push("", "Game state:", quote(JSON.stringify(caseEntry.gameState, null, 2)));
  lines.push("", "Reference answer, verbatim:", quote(caseEntry.expected.answer));
  lines.push("", `Short answer: ${caseEntry.expected.shortAnswer}`);
  lines.push("", `Deciding rule ids: ${caseEntry.expected.decidingRuleIds.join(", ")}`);
  for (const rule of texts.rules) lines.push("", `Rule ${rule.ruleId} (committed text):`, quote(rule.text ?? "(not in the committed rule index)"));
  const source = caseEntry.source;
  if (caseEntry.tier === 1) lines.push("", `Citation: Comprehensive Rules ${source.ruleId}`);
  if (caseEntry.tier === 2) lines.push("", `Citation: ${source.cardName} (${source.oracleId}), ruling dated ${source.rulingDate}`);
  if (caseEntry.tier === 3) {
    lines.push("", `Citation: ${source.citation}`, "Research (discovery only, never the answer):");
    for (const item of source.research) lines.push(`- ${item}`);
  }
  lines.push("", `Why this case is hard: ${caseEntry.whyHard}`);
  lines.push("", `${VERDICT_SLOT} `, `${NOTE_SLOT} `);
  return lines.join("\n");
}

/**
 * Renders the pending cases into batches of `batchSize`, each batch one
 * Markdown document. Returns `[{ name, markdown, caseIds }]`; an empty list when
 * nothing is pending.
 */
export function renderBatches({ cases, sources, includeNeedsEdit = false, batchSize = DEFAULT_BATCH_SIZE, renderedOn }) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("--batch-size needs a whole number of cases, such as --batch-size 25.");
  const ordered = sortForReview(pendingCases({ cases, sources, includeNeedsEdit }));
  const batches = [];
  for (let start = 0; start < ordered.length; start += batchSize) {
    const slice = ordered.slice(start, start + batchSize);
    const number = String(batches.length + 1).padStart(3, "0");
    const header = [
      `# Rules test review, batch ${number} of ${Math.ceil(ordered.length / batchSize)}${renderedOn ? ` (rendered ${renderedOn})` : ""}`,
      "",
      "For each case, write approve, reject or edit after `>>> Verdict:`. An edit needs a one-line note after `>>> Note:` saying what to change.",
      "Leave a verdict blank to skip a case; it stays pending. Do not edit anything above a verdict line: apply refuses a case whose text changed since this file was rendered.",
      "Then run `npm run eval:rules-review:apply -- <this file>`."
    ].join("\n");
    const body = slice.map((entry, index) => renderCaseEntry(entry, sources, index + 1, slice.length)).join("\n\n---\n\n");
    batches.push({
      name: `batch-${number}.md`,
      markdown: `${header}\n\n---\n\n${body}\n`,
      caseIds: slice.map(({ caseEntry }) => caseEntry.id)
    });
  }
  return batches;
}

/**
 * Reads a batch the owner has filled in. Returns every case block with its
 * fingerprint, verdict (lower-cased, empty when skipped) and note, plus the
 * problems found in the file's shape.
 */
export function parseBatch(markdown) {
  const entries = [];
  const problems = [];
  const lines = markdown.split("\n");
  let current = null;
  const finish = () => {
    if (current) entries.push(current);
    current = null;
  };
  for (const line of lines) {
    if (line.startsWith(FINGERPRINT_PREFIX) && line.endsWith(FINGERPRINT_SUFFIX)) {
      finish();
      try {
        const fingerprint = JSON.parse(line.slice(FINGERPRINT_PREFIX.length, line.length - FINGERPRINT_SUFFIX.length));
        current = { id: fingerprint.id, fingerprint, verdict: "", note: "", sawVerdictSlot: false };
      } catch {
        problems.push(`a case fingerprint line could not be read: ${line.slice(0, 80)}`);
      }
    } else if (current && line.startsWith(VERDICT_SLOT)) {
      current.verdict = line.slice(VERDICT_SLOT.length).trim().toLowerCase();
      current.sawVerdictSlot = true;
    } else if (current && line.startsWith(NOTE_SLOT)) {
      current.note = line.slice(NOTE_SLOT.length).trim();
    }
  }
  finish();
  for (const entry of entries) {
    if (!entry.sawVerdictSlot) problems.push(`${entry.id}: the batch has no "${VERDICT_SLOT}" line for this case`);
  }
  return { entries, problems };
}

/** Applies one verdict to a raw case object: only `review.*` changes, plus `snapshot` on an approve. */
function applyVerdictToCase(raw, verdict, note, reviewedOn, sources) {
  const status = verdict === "approve" ? "approved" : verdict === "reject" ? "rejected" : "needs-edit";
  const review = { status, reviewedOn };
  if (note) review.note = note;
  const updated = { ...raw, review };
  if (verdict === "approve") updated.snapshot = computeSnapshot(raw, sources);
  return updated;
}

/**
 * Applies a filled batch. `rawByCaseId` maps a case id to `{ fileName, case }`
 * as read by readCaseFiles (raw files, never the loader's derived tags). A
 * verdict is refused, and reported, for a case id that cannot be found; a
 * verdict that is not approve, reject or edit; an edit with no note; a case
 * whose question or reference answer changed since the batch was rendered; and
 * a case whose committed rule, oracle or ruling text changed since. A refused
 * case is left untouched; every other verdict is applied. Returns the updated
 * case files to write, the refusals, and the ids skipped for a blank verdict.
 */
export function applyVerdicts({ entries, rawByCaseId, sources, reviewedOn }) {
  const updated = [];
  const refused = [];
  const skipped = [];
  for (const entry of entries) {
    if (entry.verdict === "") {
      skipped.push(entry.id);
      continue;
    }
    const found = rawByCaseId.get(entry.id);
    if (!found) {
      refused.push({ id: entry.id, reason: "no case with this id exists" });
      continue;
    }
    if (!VERDICTS.includes(entry.verdict)) {
      refused.push({ id: entry.id, reason: `"${entry.verdict}" is not a verdict (use approve, reject or edit)` });
      continue;
    }
    if (entry.verdict === "edit" && entry.note === "") {
      refused.push({ id: entry.id, reason: "an edit verdict needs a note saying what to change" });
      continue;
    }
    const raw = found.case;
    if (sha256(raw.question) !== entry.fingerprint.question) {
      refused.push({ id: entry.id, reason: "its question changed since this batch was rendered" });
      continue;
    }
    if (sha256(raw.expected.answer) !== entry.fingerprint.answer) {
      refused.push({ id: entry.id, reason: "its reference answer changed since this batch was rendered" });
      continue;
    }
    const current = computeDependsOnHashes(raw, sources);
    const changed = SNAPSHOT_DEPENDENCIES.filter((dependency) => current[dependency] !== entry.fingerprint[dependency]);
    if (changed.length > 0) {
      refused.push({ id: entry.id, reason: `its committed ${changed.join(", ")} text changed since this batch was rendered` });
      continue;
    }
    const next = applyVerdictToCase(raw, entry.verdict, entry.note, reviewedOn, sources);
    const { valid, errors } = validateGoldCase(next);
    if (!valid) {
      refused.push({ id: entry.id, reason: `the updated case would be invalid: ${errors.join("; ")}` });
      continue;
    }
    updated.push({ id: entry.id, fileName: found.fileName, case: next, status: next.review.status });
  }
  return { updated, refused, skipped };
}
