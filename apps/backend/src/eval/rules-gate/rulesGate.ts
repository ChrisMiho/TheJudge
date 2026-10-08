// REQ-222: the offline prompt gate. Runs every non-rejected rules test case
// (drafts included) through the unmodified `preparePromptInput`, with the
// inputs the route handler supplies (the committed card-detail and
// card-rulings indexes, the attached cards, the query embedded), and checks:
//
//   card check (absolute)  every attached card's name, oracle text and every
//                          committed ruling appear in the prompt (no card's
//                          rulings come near the prompt's limits, measured);
//   rule check (ratchet)   against a committed per-case hit/miss baseline it
//                          fails only when a deciding rule that used to reach
//                          the prompt no longer does; new hits are reported and
//                          an explicit command raises the baseline;
//   state-fact check       where a case carries a `gameState`, every stated
//                          fact appears as its printed line (stateFacts.ts),
//                          and the request passes the In-Depth schema.
//
// The ranking uses committed frozen query vectors (frozenVectors.ts), so the
// gate is deterministic and free: no model call, no network, no embedder. A
// case whose query text changed since its vector was frozen is "awaiting a
// re-freeze": reported, skipped by the ratchet, never failed, so a card-data
// refresh cannot fail the weekly `data:refresh-pr`. A case with no vector at
// all does fail.
//
// This file takes the request builder as an argument. The caller (a backend
// vitest test) passes `buildCaseRequest` from `scripts/lib/prompt-fidelity.mjs`,
// the one request builder every instrument shares; nothing here imports a
// script, so production source never reaches outside `src`.

import type { GoldCase } from "../../../../../scripts/lib/gold-cases.mjs";
import type { PromptResources } from "../../../../../scripts/lib/prompt-fidelity.mjs";
import { DEFAULT_SUPPLEMENTAL_RULE_CAP, preparePromptInput } from "../../prompt/preparation.js";
import { askAiRequestSchema, gameContextSchema } from "../../validation/askAiRequest.js";
import { checkReFreeze, type FrozenVectorFile } from "./frozenVectors.js";
import { checkStateFacts } from "./stateFacts.js";

export type BaselineCase = { hit: string[]; miss: string[] };
export type RulesGateBaseline = { cases: Record<string, BaselineCase> };

export type CaseGateResult = {
  id: string;
  /** `awaiting-refreeze`: query text changed since the vector was frozen; skipped by the ratchet. */
  awaitingRefreeze: boolean;
  /** Card, state, schema, vector and ranking problems: any one fails the gate. */
  failures: string[];
  /** Deciding rule ids that reached the prompt; null when the case was not scored (awaiting a re-freeze or no vector). */
  hit: string[] | null;
  miss: string[] | null;
  /** Rules the baseline recorded as hits that no longer reach the prompt: fail the gate. */
  regressions: string[];
  /** Rules that reach the prompt now and were not recorded as hits: reported, never failed. */
  newHits: string[];
};

export type RulesGateSummary = {
  cases: number;
  scored: number;
  casesHit: number;
  casesMissed: number;
  awaitingRefreeze: number;
  failed: number;
  regressed: number;
  newHits: number;
};

export type RulesGateOutcome = {
  results: CaseGateResult[];
  summary: RulesGateSummary;
  ok: boolean;
  report: string;
};

export type RulesGateInputs = {
  cases: GoldCase[];
  resources: PromptResources;
  vectors: FrozenVectorFile;
  baseline: RulesGateBaseline;
  /** `buildCaseRequest` from `scripts/lib/prompt-fidelity.mjs`. */
  buildRequest: (caseEntry: GoldCase) => unknown;
  supplementalRuleCap?: number;
};

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Card check: every attached card's name, oracle text and committed rulings are in the prompt. */
export function checkCards(promptText: string, caseEntry: GoldCase, resources: PromptResources): string[] {
  const failures: string[] = [];
  const collapsedPrompt = collapse(promptText);
  for (const card of caseEntry.cards) {
    const label = `${card.name} (${card.oracleId})`;
    const detail = resources.cardDetailIndex.get(card.oracleId);
    if (!detail) {
      failures.push(`attached card ${label} is not in the committed card-detail index`);
      continue;
    }
    if (!promptText.includes(card.name)) {
      failures.push(`attached card ${label}: its name does not reach the prompt`);
    }
    const oracleText = collapse(detail.oracleText ?? "");
    if (oracleText.length > 0 && !collapsedPrompt.includes(oracleText)) {
      failures.push(`attached card ${label}: its oracle text does not reach the prompt`);
    }
    for (const ruling of resources.cardRulingsIndex.get(card.oracleId) ?? []) {
      if (!collapsedPrompt.includes(collapse(`- ${ruling.publishedAt}: ${ruling.comment}`))) {
        failures.push(`attached card ${label}: the ${ruling.publishedAt} ruling does not reach the prompt`);
      }
    }
  }
  return failures;
}

/**
 * Schema check: every non-null `gameState` in the corpus must parse under the
 * In-Depth request's own `gameContextSchema`. The `.mjs` case loader checks
 * only the structural rules, because that schema is TypeScript. Returns one
 * failure per rejected case, naming the case.
 */
export function findGameStateSchemaFailures(cases: GoldCase[]): string[] {
  const failures: string[] = [];
  for (const caseEntry of cases) {
    if (caseEntry.gameState === null) continue;
    const parsed = gameContextSchema.safeParse(caseEntry.gameState);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
      failures.push(`${caseEntry.id}: gameState is rejected by the In-Depth gameContextSchema: ${issues.join("; ")}`);
    }
  }
  return failures;
}

function evaluateCase(caseEntry: GoldCase, inputs: RulesGateInputs): CaseGateResult {
  const { resources, vectors, baseline, buildRequest } = inputs;
  const result: CaseGateResult = {
    id: caseEntry.id,
    awaitingRefreeze: false,
    failures: [],
    hit: null,
    miss: null,
    regressions: [],
    newHits: []
  };

  const parsedRequest = askAiRequestSchema.safeParse(buildRequest(caseEntry));
  if (!parsedRequest.success) {
    const issues = parsedRequest.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
    result.failures.push(`the request built for this case is rejected by the Ask AI schema: ${issues.join("; ")}`);
    return result;
  }
  const request = parsedRequest.data;

  const freeze = checkReFreeze(caseEntry.id, request, resources.cardDetailIndex, vectors);
  if (freeze.state === "missing") {
    result.failures.push("no frozen query vector (run `npm run eval:build-rules-gate-vectors`)");
  } else if (freeze.state === "awaiting-refreeze") {
    result.awaitingRefreeze = true;
  }

  const prepared = preparePromptInput(request, {
    ...resources,
    queryEmbedding: freeze.state === "fresh" ? freeze.vector : null,
    supplementalRuleCap: inputs.supplementalRuleCap ?? DEFAULT_SUPPLEMENTAL_RULE_CAP,
    collectEnrichmentDebug: true
  });

  result.failures.push(...checkCards(prepared.promptText, caseEntry, resources));
  result.failures.push(...checkStateFacts(caseEntry, prepared.promptText));

  if (freeze.state !== "fresh") return result;

  const supplemental = prepared.enrichmentDebug?.supplemental as
    | { usedSemantic?: boolean; selected: Array<{ ruleId: string }> }
    | undefined;
  if (supplemental?.usedSemantic !== true) {
    result.failures.push(
      "ranked lexically although a frozen vector was supplied (the committed rule embeddings do not match the rule index)"
    );
  }
  const selected = new Set((supplemental?.selected ?? []).map((rule) => rule.ruleId));
  const deciding = caseEntry.expected.decidingRuleIds;
  result.hit = deciding.filter((ruleId) => selected.has(ruleId));
  result.miss = deciding.filter((ruleId) => !selected.has(ruleId));

  const recorded = baseline.cases[caseEntry.id];
  const recordedHits = new Set(recorded?.hit ?? []);
  result.regressions = [...recordedHits].filter((ruleId) => !selected.has(ruleId));
  result.newHits = result.hit.filter((ruleId) => !recordedHits.has(ruleId));
  return result;
}

export function formatGateReport(results: CaseGateResult[], summary: RulesGateSummary): string {
  const lines: string[] = [];
  for (const result of results) {
    for (const failure of result.failures) lines.push(`FAIL ${result.id}: ${failure}`);
    for (const ruleId of result.regressions) {
      lines.push(`FAIL ${result.id}: deciding rule ${ruleId} used to reach the prompt and no longer does (ratchet)`);
    }
    if (result.awaitingRefreeze) {
      lines.push(`AWAITING RE-FREEZE ${result.id}: its query text changed since its vector was frozen (not scored)`);
    }
  }
  const newHitCases = results.filter((result) => result.newHits.length > 0);
  if (newHitCases.length > 0) {
    lines.push(
      `New hits to record with \`npm run eval:rules-gate:baseline\`: ${newHitCases
        .map((result) => `${result.id} [${result.newHits.join(", ")}]`)
        .join("; ")}`
    );
  }
  lines.push(
    `Rules gate: ${summary.cases} cases, ${summary.scored} scored (${summary.casesHit} hit, ${summary.casesMissed} missed), ` +
      `${summary.awaitingRefreeze} awaiting re-freeze, ${summary.regressed} regressed, ${summary.failed} failed`
  );
  return lines.join("\n");
}

/** Runs the whole gate over a corpus. Pure over its inputs: no embedder, no network, no clock. */
export function evaluateRulesGate(inputs: RulesGateInputs): RulesGateOutcome {
  const results = inputs.cases
    .filter((caseEntry) => caseEntry.review.status !== "rejected")
    .map((caseEntry) => evaluateCase(caseEntry, inputs));

  const scored = results.filter((result) => result.hit !== null);
  const summary: RulesGateSummary = {
    cases: results.length,
    scored: scored.length,
    casesHit: scored.filter((result) => result.miss?.length === 0).length,
    casesMissed: scored.filter((result) => (result.miss?.length ?? 0) > 0).length,
    awaitingRefreeze: results.filter((result) => result.awaitingRefreeze).length,
    failed: results.filter((result) => result.failures.length > 0).length,
    regressed: results.filter((result) => result.regressions.length > 0).length,
    newHits: results.reduce((total, result) => total + result.newHits.length, 0)
  };
  return {
    results,
    summary,
    ok: summary.failed === 0 && summary.regressed === 0,
    report: formatGateReport(results, summary)
  };
}

/**
 * The explicit baseline raise (`npm run eval:rules-gate:baseline`): records
 * each scored case's hit and miss lists. It refuses while any recorded hit has
 * been lost (a regression) unless the caller passes `allowRegressions`, which
 * is a deliberate decision to accept the loss. A case that was not scored
 * (awaiting a re-freeze, or no vector) keeps its previous entry, and a case no
 * longer in the corpus is dropped.
 */
export function raiseBaseline(
  previous: RulesGateBaseline,
  results: CaseGateResult[],
  { allowRegressions = false }: { allowRegressions?: boolean } = {}
): { baseline: RulesGateBaseline; regressions: string[]; added: string[] } {
  const regressions = results.flatMap((result) => result.regressions.map((ruleId) => `${result.id}: ${ruleId}`));
  if (regressions.length > 0 && !allowRegressions) {
    throw new Error(
      `Refusing to raise the baseline: ${regressions.length} recorded hit(s) were lost (${regressions.join(", ")}). Fix the regression, or pass --allow-regressions to accept it.`
    );
  }
  const cases: Record<string, BaselineCase> = {};
  const added: string[] = [];
  for (const result of [...results].sort((a, b) => a.id.localeCompare(b.id))) {
    if (result.hit !== null && result.miss !== null) {
      cases[result.id] = { hit: [...result.hit], miss: [...result.miss] };
      if (result.newHits.length > 0) added.push(`${result.id}: ${result.newHits.join(", ")}`);
    } else if (previous.cases[result.id]) {
      cases[result.id] = previous.cases[result.id];
    }
  }
  return { baseline: { cases }, regressions, added };
}
