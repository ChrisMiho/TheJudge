// Offline, counts-only check of the committed diagnostic and held-out manifests against the committed corpus.
// Usage (from the repo root): node ./PRD/work/follow-ups-keep-their-rules/evidence/measure-manifest.mjs "$PWD"
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = process.argv[2];
const sha = (t) => createHash("sha256").update(t, "utf8").digest("hex");
const casesDir = join(root, "apps/backend/src/eval/worked-solutions");
const byId = new Map();
for (const f of readdirSync(casesDir).filter((n) => n.endsWith(".case.json"))) {
  const c = JSON.parse(readFileSync(join(casesDir, f), "utf8"));
  byId.set(c.id, c);
}
const approvedAll = [...byId.values()].filter((c) => c.review?.status === "approved").length;
console.log(`corpus case files: ${byId.size}; approved: ${approvedAll}`);

for (const name of ["diagnostic", "held-out"]) {
  const m = JSON.parse(readFileSync(join(root, `apps/backend/src/eval/answer-quality/manifests/${name}.json`), "utf8"));
  let missing = 0, notApproved = 0, stale = 0, qMismatch = 0, aMismatch = 0, inDepth = 0, lookup = 0;
  const tiers = {};
  let maxQ = 0;
  for (const e of m.cases) {
    const c = byId.get(e.id);
    if (!c) { missing++; continue; }
    if (c.review?.status !== "approved") notApproved++;
    if (c.review?.stale || c.stale) stale++;
    if (sha(c.question) !== e.questionSha256) qMismatch++;
    if (sha(c.expected.answer) !== e.answerSha256) aMismatch++;
    if (c.gameState) inDepth++; else lookup++;
    tiers[c.tier] = (tiers[c.tier] ?? 0) + 1;
    maxQ = Math.max(maxQ, c.question.length);
  }
  console.log(`${name}: listed ${m.cases.length} (caseCount field ${m.caseCount}); missing ${missing}; not approved ${notApproved}; stale ${stale}; question-hash mismatch ${qMismatch}; answer-hash mismatch ${aMismatch}; In-Depth ${inDepth}; lookup ${lookup}; tiers ${JSON.stringify(tiers)}; longest question ${maxQ} chars`);
  for (const g of m.appendedGroups ?? []) {
    const ids = g.cases ?? g.caseIds ?? [];
    console.log(`  appended group ${g.name}: ${ids.length} cases`);
  }
}
