// Free, local audit of the rule book data (CR source -> rule index -> embeddings -> topics).
// Read-only: never writes product data. Run from the repo root:
//   node PRD/work/probe-prompt-format-tuning/runs/audit-data/audit-data.mjs
// Writes results to runs/audit-data/out/*.json and prints a summary.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parseRuleIndex, extractRuleExcerpt, isHeadingOnlyEntry } from "../../../../../scripts/build-game-rules.mjs";

const ROOT = process.cwd();
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "out");
fs.mkdirSync(OUT, { recursive: true });
const D = (p) => path.join(ROOT, "apps/backend/data", p);
const src = fs.readFileSync(D("cr/source.txt"), "utf8").replace(/\r\n?/g, "\n");
const rawIndex = fs.readFileSync(D("gameRulesRuleIndex.json"), "utf8");
const index = JSON.parse(rawIndex);
const emb = JSON.parse(fs.readFileSync(D("gameRulesRuleEmbeddings.json"), "utf8"));
const topics = JSON.parse(fs.readFileSync(D("gameRulesByTopic.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(D("gameRulesTopicManifest.json"), "utf8"));
const tokenStats = JSON.parse(fs.readFileSync(D("gameRulesTokenStats.json"), "utf8"));
const byId = new Map(index.map((e) => [e.ruleId, e]));
const R = {};

// ---------- 0. Reproducibility: does the committed index equal a fresh parse of source.txt? ----------
const fresh = parseRuleIndex(src);
const freshIds = fresh.map((e) => e.ruleId);
const diffs = [];
for (let i = 0; i < Math.max(fresh.length, index.length); i++) {
  const a = fresh[i], b = index[i];
  if (!a || !b || a.ruleId !== b.ruleId || a.text !== b.text || a.sectionTitle !== b.sectionTitle || a.searchText !== b.searchText) {
    diffs.push({ i, fresh: a?.ruleId, committed: b?.ruleId });
  }
}
R.reproducible = { freshCount: fresh.length, committedCount: index.length, diffCount: diffs.length, firstDiffs: diffs.slice(0, 5) };
R.crEffective = /effective as of ([^.]+)\./.exec(src)?.[1];

// ---------- 1. Independent line-level parse of the body ----------
const lines = src.split("\n");
const glossaryLines = lines.map((l, i) => (/^Glossary\s*$/.test(l) ? i : -1)).filter((i) => i >= 0);
const bodyStart = glossaryLines[0] + 1, bodyEnd = glossaryLines[glossaryLines.length - 1];
const kinds = { section: [], rule: [], subrule: [], part: [], example: [], blank: [], other: [] };
const rawRules = []; // {id, line}
for (let i = bodyStart; i < bodyEnd; i++) {
  const l = lines[i];
  let m;
  if (/^\s*$/.test(l)) kinds.blank.push(i);
  else if ((m = /^(\d{3})\. (.+)$/.exec(l))) { kinds.section.push(i); rawRules.push({ id: m[1], line: i, kind: "section", rest: m[2] }); }
  else if ((m = /^(\d{3}\.\d+)\. /.exec(l))) { kinds.rule.push(i); rawRules.push({ id: m[1], line: i, kind: "rule" }); }
  else if ((m = /^(\d{3}\.\d+[a-z])\s/.exec(l))) { kinds.subrule.push(i); rawRules.push({ id: m[1], line: i, kind: "subrule" }); }
  else if (/^\d\. /.test(l)) kinds.part.push({ i, l });
  else if (/^Example:/.test(l)) kinds.example.push(i);
  else kinds.other.push({ i, l: l.slice(0, 160) });
}
// Odd id-shaped lines the strict patterns missed (e.g. "702.19." with no space, ids with 2 letters)
const oddIdLines = kinds.other.filter((o) => /^\d{3}/.test(o.l));
R.lineKinds = Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, v.length]));
R.otherLines = kinds.other.slice(0, 40);
R.oddIdLines = oddIdLines;
R.partHeaders = kinds.part;

// raw ids vs index ids
const rawIds = rawRules.map((r) => r.id);
const rawIdCounts = new Map();
for (const id of rawIds) rawIdCounts.set(id, (rawIdCounts.get(id) ?? 0) + 1);
R.rawDuplicateIds = [...rawIdCounts].filter(([, n]) => n > 1);
const indexIdSet = new Set(index.map((e) => e.ruleId));
const indexDupes = index.length - indexIdSet.size;
const missingFromIndex = rawRules.filter((r) => !indexIdSet.has(r.id));
R.completeness = {
  rawSections: kinds.section.length,
  rawNumberedRules: kinds.rule.length,
  rawSubrules: kinds.subrule.length,
  rawTotal: rawRules.length,
  indexEntries: index.length,
  indexDuplicateIds: indexDupes,
  missingFromIndexByKind: missingFromIndex.reduce((acc, r) => ((acc[r.kind] = (acc[r.kind] ?? 0) + 1), acc), {}),
  missingNonSectionIds: missingFromIndex.filter((r) => r.kind !== "section").map((r) => r.id),
  indexIdsNotInRaw: [...indexIdSet].filter((id) => !rawIdCounts.has(id)),
  orderMatchesSource: (() => { const rawOrder = rawIds.filter((id) => indexIdSet.has(id)); return rawOrder.join() === index.map((e) => e.ruleId).join(); })()
};

// heading-only entries dropped: what titles do they carry, and does their content survive anywhere?
const dropped = missingFromIndex.filter((r) => r.kind !== "section").map((r) => ({ id: r.id, line: lines[r.line] }));
R.droppedHeadings = dropped;

// ---------- 2. id sequence sanity ----------
const seqIssues = [];
const groups = new Map();
for (const r of rawRules) {
  if (r.kind === "subrule") {
    const parent = r.id.replace(/[a-z]$/, "");
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(r.id.slice(-1));
  }
}
const LETTERS = "abcdefghijkmnpqrstuvwxyz";
for (const [parent, letters] of groups) {
  const expected = LETTERS.slice(0, letters.length).split("");
  if (letters.join("") !== expected.join("")) seqIssues.push({ parent, letters: letters.join("") });
  if (!rawIdCounts.has(parent)) seqIssues.push({ parent, issue: "subrules without parent rule line" });
}
const maxLetters = [...groups].sort((a, b) => b[1].length - a[1].length).slice(0, 5).map(([p, l]) => `${p}: ${l.length} (${l[0]}..${l[l.length - 1]})`);
R.idSequence = { lettersGroups: groups.size, issues: seqIssues, longestLetterRuns: maxLetters };

// ---------- 3. text quality per entry ----------
const partHeaderFused = index.filter((e) => /\n\s*\n\d\. [A-Z]/.test(e.text) || /\n\d\. [A-Z][^\n]*$/.test(e.text));
const exampleFused = index.filter((e) => /\nExample:/.test(e.text));
const exampleCounts = exampleFused.map((e) => (e.text.match(/\nExample:/g) || []).length);
const multiPara = index.filter((e) => e.text.split("\n").filter((l) => l.trim() && !/^Example:/.test(l) && !/^\d\. /.test(l)).length > 1);
const exampleChars = index.reduce((acc, e) => {
  const idx = e.text.indexOf("\nExample:");
  return acc + (idx >= 0 ? e.text.length - idx : 0);
}, 0);
const totalChars = index.reduce((a, e) => a + e.text.length, 0);
R.textQuality = {
  partHeaderFused: partHeaderFused.map((e) => ({ id: e.ruleId, tail: e.text.slice(-60) })),
  exampleFusedEntries: exampleFused.length,
  exampleLinesTotal: exampleCounts.reduce((a, b) => a + b, 0),
  maxExamplesInOne: Math.max(...exampleCounts),
  exampleShareOfAllChars: +(exampleChars / totalChars).toFixed(3),
  multiParagraphNonExample: multiPara.map((e) => e.ruleId),
  emptyOrIdOnly: index.filter((e) => e.text.replace(new RegExp(`^${e.ruleId.replace(/\./g, "\\.")}\\.?\\s*`), "").trim().length < 5).map((e) => e.ruleId),
  textNotStartingWithId: index.filter((e) => !e.text.startsWith(e.ruleId)).map((e) => e.ruleId),
  trailingWhitespaceLines: index.filter((e) => /\n \n/.test(e.text)).length
};

// characters
const charCounts = new Map();
for (const e of index) for (const ch of e.text) if (ch.charCodeAt(0) > 126 || ch === "\t") charCounts.set(ch, (charCounts.get(ch) ?? 0) + 1);
const srcChars = new Map();
for (const ch of src) if (ch.charCodeAt(0) > 126) srcChars.set(ch, (srcChars.get(ch) ?? 0) + 1);
R.characters = {
  nonAsciiInIndex: [...charCounts].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${JSON.stringify(c)} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")} x${n}`),
  mojibake: index.filter((e) => /Ã|â€|�/.test(e.text)).map((e) => e.ruleId),
  manaSymbolEntries: index.filter((e) => /\{[WUBRGCXTQSE0-9/PH]+\}/.test(e.text)).length,
  curlyApostropheEntries: index.filter((e) => /[’‘]/.test(e.text)).length,
  straightApostropheEntries: index.filter((e) => /'/.test(e.text)).length
};

// text vs searchText
const stMismatch = index.filter((e) => e.searchText !== [e.ruleId, e.sectionTitle, e.text].join(" ").toLowerCase());
R.searchText = { mismatchWithFormula: stMismatch.length };

// tokenizer behaviour (mirror of gameRulesRetrieval.ts tokenize)
const STOP = new Set(["and","are","can","card","cards","does","for","from","has","have","how","one","that","the","this","what","when","will","with"]);
const tokenize = (v) => v.toLowerCase().split(/[^a-z0-9.]+/).map((t) => t.trim()).filter((t) => t.length >= 3 && !STOP.has(t));
const tokList = Object.keys(tokenStats.tokens);
const dotted = tokList.filter((t) => /[a-z]\.$/.test(t));
const dottedDf = dotted.reduce((a, t) => a + tokenStats.tokens[t].df, 0);
let tokensTotal = 0, tokensDotted = 0;
for (const e of index) for (const t of tokenize(e.searchText)) { tokensTotal++; if (/[a-z]\.$/.test(t)) tokensDotted++; }
const examplesDotted = ["life.", "graveyard.", "battlefield.", "damage.", "turn.", "stack.", "priority.", "exile.", "trample.", "deathtouch."].map((t) => ({ t, df: tokenStats.tokens[t]?.df ?? 0, bareDf: tokenStats.tokens[t.slice(0, -1)]?.df ?? 0 }));
// apostrophe splitting
const apos = ["doesn’t", "can’t", "player’s", "owner’s", "isn’t", "won’t", "it’s"].map((w) => ({ w, tokens: tokenize(w) }));
R.tokenStats = {
  N: tokenStats.N, matchesIndex: tokenStats.N === index.length,
  vocabSize: tokList.length,
  wordTokensWithTrailingPeriod: dotted.length,
  shareOfTokenOccurrencesWithTrailingPeriod: +(tokensDotted / tokensTotal).toFixed(3),
  dottedExamples: examplesDotted,
  apostropheTokens: apos,
  numericRuleIdTokens: tokList.filter((t) => /^\d{3}(\.\d+[a-z]?)?\.?$/.test(t)).length
};
// recompute df and compare
const df = new Map();
for (const e of index) for (const t of new Set(tokenize(e.searchText))) df.set(t, (df.get(t) ?? 0) + 1);
R.tokenStats.dfMismatches = [...df].filter(([t, n]) => tokenStats.tokens[t]?.df !== n).length + tokList.filter((t) => !df.has(t)).length;

// ---------- 4. sectionTitle quality ----------
const titleCounts = new Map();
const titleSections = new Map();
for (const e of index) {
  titleCounts.set(e.sectionTitle, (titleCounts.get(e.sectionTitle) ?? 0) + 1);
  const sec = e.ruleId.slice(0, 3);
  if (!titleSections.has(e.sectionTitle)) titleSections.set(e.sectionTitle, new Set());
  titleSections.get(e.sectionTitle).add(sec);
}
R.sectionTitles = {
  distinct: titleCounts.size,
  sharedAcrossSections: [...titleSections].filter(([, s]) => s.size > 1).map(([t, s]) => ({ title: t, sections: [...s], pieces: titleCounts.get(t) })),
  biggest: [...titleCounts].sort((a, b) => b[1] - a[1]).slice(0, 8)
};
// rule-family titles (e.g. "702.19. Trample") that are dropped and never appear in a child's text
const famTitle = new Map(); // id -> title
for (const r of rawRules) if (r.kind === "rule") {
  const l = lines[r.line];
  const rest = l.replace(/^\d{3}\.\d+\.\s*/, "");
  if (isHeadingOnlyEntry(r.id, l)) famTitle.set(r.id, rest.trim());
}
let childrenMissingTitle = 0, childrenTotal = 0;
const famExamples = [];
for (const [fid, title] of famTitle) {
  const kids = index.filter((e) => e.parentRuleIds[0] === fid);
  const word = title.replace(/\s*\(.*\)$/, "").toLowerCase();
  for (const k of kids) {
    childrenTotal++;
    if (!k.text.toLowerCase().includes(word)) {
      childrenMissingTitle++;
      if (famExamples.length < 25) famExamples.push(`${k.ruleId} [${title}]: ${k.text.slice(0, 140)}`);
    }
  }
}
R.familyTitles = { headingOnlyFamilies: famTitle.size, children: childrenTotal, childrenNotNamingTheirFamily: childrenMissingTitle, examples: famExamples, sampleFamilies: [...famTitle].slice(0, 10) };

// parentRuleIds sanity
const badParents = index.filter((e) => e.parentRuleIds.some((p) => !rawIdCounts.has(p)));
const parentsNotInIndex = new Map();
for (const e of index) for (const p of e.parentRuleIds) if (!indexIdSet.has(p)) parentsNotInIndex.set(p, (parentsNotInIndex.get(p) ?? 0) + 1);
R.parents = {
  entriesWithParentNotInSource: badParents.map((e) => e.ruleId),
  distinctParentIdsNotInIndex: parentsNotInIndex.size,
  entriesWhoseDirectParentIsNotInIndex: index.filter((e) => e.parentRuleIds[0] && !indexIdSet.has(e.parentRuleIds[0])).length
};

// ---------- 5. lengths ----------
const lens = index.map((e) => ({ id: e.ruleId, chars: e.text.length, words: e.text.split(/\s+/).length, embChars: `${e.sectionTitle}: ${e.text}`.length }));
const sorted = [...lens].sort((a, b) => a.chars - b.chars);
const pct = (p) => sorted[Math.floor((sorted.length - 1) * p)].chars;
R.lengths = {
  chars: { min: sorted[0], p10: pct(0.1), median: pct(0.5), p90: pct(0.9), p99: pct(0.99), max: sorted[sorted.length - 1] },
  shortest: sorted.slice(0, 12).map((x) => `${x.id} (${x.chars}): ${byId.get(x.id).text}`),
  longest: sorted.slice(-15).reverse().map((x) => `${x.id} ${x.chars}`),
  over2000EmbeddingChars: lens.filter((x) => x.embChars > 2000).map((x) => ({ id: x.id, embChars: x.embChars, lostChars: x.embChars - 2000 }))
};

// ---------- 6. embeddings artifact ----------
const curHash = createHash("sha256").update(rawIndex).digest("hex");
R.embeddings = {
  model: emb.model, dims: emb.dims, encoding: emb.encoding, generatedAt: emb.generatedAt,
  count: emb.ruleIds.length, indexCount: index.length,
  sameOrder: emb.ruleIds.join() === index.map((e) => e.ruleId).join(),
  sameSet: emb.ruleIds.length === indexIdSet.size && emb.ruleIds.every((id) => indexIdSet.has(id)),
  hashMatchesCurrentIndex: emb.ruleIndexHash === curHash,
  decodedBytes: Buffer.from(emb.vectorsBase64, "base64").byteLength,
  expectedBytes: emb.ruleIds.length * emb.dims
};
// duplicate / near-zero vectors
{
  const buf = Buffer.from(emb.vectorsBase64, "base64");
  const v = new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const seen = new Map(); const dupes = [];
  for (let i = 0; i < emb.ruleIds.length; i++) {
    const key = createHash("md5").update(Buffer.from(v.buffer, v.byteOffset + i * emb.dims, emb.dims)).digest("hex");
    if (seen.has(key)) dupes.push([seen.get(key), emb.ruleIds[i]]); else seen.set(key, emb.ruleIds[i]);
  }
  R.embeddings.identicalVectorPairs = dupes;
}

// ---------- 7. curated topics ----------
const topicIssues = [];
for (const t of topics) {
  for (const rn of t.ruleNumbers) {
    if (!indexIdSet.has(rn)) topicIssues.push({ topic: t.id, rule: rn, issue: "rule id not in index" });
  }
  const regenerated = t.ruleNumbers.map((rn) => extractRuleExcerpt(src, rn)).join("\n");
  if (regenerated !== t.excerpt) topicIssues.push({ topic: t.id, issue: "excerpt differs from current CR" });
  const fromIndex = t.ruleNumbers.map((rn) => byId.get(rn)?.text ?? "").join("\n");
  if (fromIndex !== t.excerpt) topicIssues.push({ topic: t.id, issue: "excerpt differs from index text", detail: t.ruleNumbers.filter((rn) => !t.excerpt.includes(byId.get(rn)?.text ?? "@@")) });
  if (/\n\d\. [A-Z]/.test(t.excerpt)) topicIssues.push({ topic: t.id, issue: "part header fused into excerpt" });
  // children of cited rules that are not cited (e.g. cites 603.7 but not 603.7a-g)
  const uncitedChildren = [];
  for (const rn of t.ruleNumbers) {
    const kids = index.filter((e) => e.parentRuleIds[0] === rn && !t.ruleNumbers.includes(e.ruleId)).map((e) => e.ruleId);
    if (kids.length) uncitedChildren.push(`${rn} -> ${kids.length} uncited: ${kids.slice(0, 8).join(",")}${kids.length > 8 ? "…" : ""}`);
  }
  if (uncitedChildren.length) topicIssues.push({ topic: t.id, issue: "cites a parent but not its sub-rules", detail: uncitedChildren });
  // excerpt ends with ':' (introduces a list it doesn't include)
  for (const rn of t.ruleNumbers) {
    const tx = byId.get(rn)?.text ?? "";
    if (/:\s*$/.test(tx.split("\nExample:")[0])) {
      const kids = index.filter((e) => e.parentRuleIds[0] === rn).map((e) => e.ruleId);
      const missing = kids.filter((k) => !t.ruleNumbers.includes(k));
      if (missing.length) topicIssues.push({ topic: t.id, issue: `cites ${rn} which ends with ':' but omits its list`, detail: missing });
    }
  }
}
const manifestTopicIds = manifest.map((t) => t.id).sort();
R.topics = {
  manifestCount: manifest.length, artifactCount: topics.length,
  manifestVsArtifactIdsEqual: manifestTopicIds.join() === topics.map((t) => t.id).sort().join(),
  manifestVsArtifactRuleNumbersEqual: manifest.every((m) => JSON.stringify(m.ruleNumbers) === JSON.stringify(topics.find((t) => t.id === m.id)?.ruleNumbers)),
  totalCitedRules: topics.reduce((a, t) => a + t.ruleNumbers.length, 0),
  issues: topicIssues
};
// extractRuleExcerpt on a bare section number reads the table of contents
R.topics.extractSectionNumberDemo = { "613": extractRuleExcerpt(src, "613"), "514": extractRuleExcerpt(src, "514") };

// ---------- 8. cross-references ----------
// Patterns: "rule 514.2", "rules 702.19b and 702.19c", "rules 613.1–613.4", "section 5"
const refRe = /\brules?\s+((?:\d{3}(?:\.\d+[a-z]?)?(?:\s*(?:,|and|or|through|–|-)\s*)?)+)/g;
const idRe = /\d{3}(?:\.\d+[a-z]?)?/g;
const sectionRefRe = /\bsection\s+(\d)\b/g;
const refsBy = [];
const targetCount = new Map();
let piecesWithRefs = 0, piecesWithSeeRule = 0, piecesWithSectionRef = 0;
let refsToSectionsOrHeadings = 0, refsToMissing = 0, refsTotal = 0, refsToFamilyHeading = 0, refsToBareSection = 0;
for (const e of index) {
  const body = e.text.replace(new RegExp(`^${e.ruleId.replace(/\./g, "\\.")}\\.?\\s*`), "");
  const targets = new Set();
  for (const m of body.matchAll(refRe)) for (const id of m[1].match(idRe) ?? []) if (id !== e.ruleId) targets.add(id);
  if (/\bsee rules?\b/i.test(body)) piecesWithSeeRule++;
  if (sectionRefRe.test(body)) piecesWithSectionRef++;
  sectionRefRe.lastIndex = 0;
  if (targets.size) {
    piecesWithRefs++;
    refsBy.push({ id: e.ruleId, targets: [...targets] });
    for (const t of targets) {
      refsTotal++;
      targetCount.set(t, (targetCount.get(t) ?? 0) + 1);
      if (!indexIdSet.has(t)) {
        if (/^\d{3}$/.test(t)) refsToBareSection++;
        else if (rawIdCounts.has(t)) refsToFamilyHeading++;
        else refsToMissing++;
      }
    }
  }
}
const missingTargets = [...targetCount].filter(([t]) => !rawIdCounts.has(t));
R.crossRefs = {
  piecesWithAnyRuleRef: piecesWithRefs,
  piecesSayingSeeRule: piecesWithSeeRule,
  piecesCitingAWholePart: piecesWithSectionRef,
  refsTotal,
  refsToBareSection,          // "see rule 613" -> no such piece; section heading dropped
  refsToFamilyHeading,        // "see rule 702.19" -> heading-only, dropped; content is in 702.19a..
  refsToIdsNotInSource: refsToMissing,
  missingTargets,
  top30Targets: [...targetCount].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([t, n]) => `${t} x${n}${indexIdSet.has(t) ? "" : rawIdCounts.has(t) ? (/^\d{3}$/.test(t) ? " (section heading, not a piece)" : " (family heading, not a piece)") : " (NOT IN CR)"}`)
};
fs.writeFileSync(path.join(OUT, "cross-refs.json"), JSON.stringify(refsBy, null, 1));

// pieces whose own text is ONLY a pointer (meaning lives at the target)
const pointerOnly = index.filter((e) => {
  const body = e.text.split("\nExample:")[0].replace(new RegExp(`^${e.ruleId.replace(/\./g, "\\.")}\\.?\\s*`), "");
  return /^(See|For more information|For rules)/i.test(body) || (/\bsee rules?\b/i.test(body) && body.length < 120);
});
R.crossRefs.pointerOnlyPieces = { count: pointerOnly.length, examples: pointerOnly.slice(0, 12).map((e) => e.text.slice(0, 160)) };

// ---------- 9. context-loss patterns ----------
const body = (e) => e.text.split("\nExample:")[0].replace(new RegExp(`^${e.ruleId.replace(/\./g, "\\.")}\\.?\\s*`), "");
const patterns = {
  "anaphoric opener (This/That/These/Those/It/They/Such/Each such/In that case/If so/If it…)": /^(This|That|These|Those|It|Its|They|Their|Such|Each such|In that case|If so|If it|If they|If that|If this|If those|Then|Otherwise|However|Instead|In addition|Additionally|Similarly|Likewise|As with|Unlike)\b/,
  "temporal pointer (At this point / At that time / After that / Once …)": /^(At this point|At that time|After that|After this|Once this|Once that|At the same time|Immediately)/,
  "refers to 'this rule'/'the previous rule'/'the above'": /\b(this rule|the previous rule|the preceding rule|the above|as described above|described in rule)\b/i,
  "ends with ':' (introduces a list that is in other pieces)": /:\s*$/,
  "'the following' (exception/rules/steps) without the list": /\bthe following\b/i,
  "sequence step (First, / Second, / Third, / Finally, / Then,)": /^(First|Second|Third|Fourth|Fifth|Finally|Then|Next|Last),/,
  "sub-rule without a subject keyword (no capitalised term, <25 words)": null
};
const contextLoss = {};
for (const [name, re] of Object.entries(patterns)) {
  if (!re) continue;
  const hits = index.filter((e) => re.test(body(e)));
  contextLoss[name] = { count: hits.length, examples: hits.slice(0, 6).map((e) => e.text.slice(0, 150).replace(/\n/g, " ")) };
}
// "instances of this ability" in 702 children -> requires the family title to understand
const thisAbility = index.filter((e) => /\b(this ability|this keyword|this action|the ability|that ability|this mechanic)\b/i.test(body(e)) && !/^\d{3}\.\d+\. /.test(e.text));
contextLoss["'this ability/this keyword/the ability' in a sub-rule"] = { count: thisAbility.length, examples: thisAbility.slice(0, 6).map((e) => e.text.slice(0, 150)) };
const anyLoss = new Set();
for (const e of index) {
  const b = body(e);
  if (Object.values(patterns).some((re) => re && re.test(b)) || thisAbility.includes(e)) anyLoss.add(e.ruleId);
}
// children of list-head rules (parent ends with ':'): list items whose meaning comes from the parent's lead-in
const listHeads = new Set(index.filter((e) => /:\s*$/.test(body(e))).map((e) => e.ruleId));
const listItems = index.filter((e) => listHeads.has(e.parentRuleIds[0]));
contextLoss["list item whose parent ends with ':' (parent holds the lead-in)"] = { count: listItems.length, parents: [...listHeads] };
for (const e of listItems) anyLoss.add(e.ruleId);
contextLoss.unionCount = anyLoss.size;
fs.writeFileSync(path.join(OUT, "context-loss-ids.json"), JSON.stringify([...anyLoss]));
R.contextLoss = contextLoss;

// ---------- 10. Glossary ----------
const glossary = lines.slice(bodyEnd + 1).join("\n");
const credIdx = glossary.lastIndexOf("\nCredits");
const gloss = credIdx >= 0 ? glossary.slice(0, credIdx) : glossary;
const terms = gloss.split(/\n[ \u00a0]*\n/).map((b) => b.trim()).filter(Boolean);
const termEntries = terms.map((b) => { const [t, ...rest] = b.split("\n"); return { term: t, def: rest.join(" ") }; }).filter((x) => x.def);
const obsolete = termEntries.filter((x) => /\(Obsolete\)|obsolete/i.test(x.def));
const noRuleRef = termEntries.filter((x) => !/\brules?\s+\d{3}|\bsection\s+\d/i.test(x.def));
R.glossary = {
  inIndex: false,
  entries: termEntries.length,
  obsoleteTermEntries: obsolete.length,
  obsoleteExamples: obsolete.slice(0, 15).map((x) => `${x.term}: ${x.def.slice(0, 120)}`),
  entriesWithNoRulePointer: noRuleRef.length,
  noPointerExamples: noRuleRef.filter((x) => !/obsolete/i.test(x.def)).slice(0, 15).map((x) => `${x.term}: ${x.def.slice(0, 120)}`)
};

fs.writeFileSync(path.join(OUT, "audit.json"), JSON.stringify(R, null, 1));
fs.writeFileSync(path.join(OUT, "lengths.json"), JSON.stringify(lens));
console.log(JSON.stringify(R, null, 1).slice(0, 200000));
