// Type declarations for `gold-cases.mjs`, the shared rules-test-case loader
// (REQ-185). Backend vitest tests import the real module at run time; this
// file only lets the backend typecheck accept that import (rootDir `src`,
// strict, no allowJs). It states types and never logic: a renamed or removed
// export fails a test even if this declaration lags. `loadGoldCases` and
// `validateGoldCase` take the external-mode option the local practice suite
// uses (REQ-232).

export type CaseTier = 1 | 2 | 3;
export type ReviewStatus = "draft" | "approved" | "needs-edit" | "rejected";
export type CaseOutcome = "works" | "does-not-work" | "depends";
export type SnapshotDependency = "rules" | "oracle" | "rulings";

export type AttachedCard = { oracleId: string; name: string };

/** One card in a case's `gameState` zone; the shape mirrors the In-Depth request's zone card. */
export type GameStateCard = {
  cardId: string;
  name?: string;
  caster?: string;
  owner?: string;
  targets?: unknown[];
  contextNotes?: string;
  copies?: number;
  [key: string]: unknown;
};

/** An In-Depth `gameContext`; the full schema check is the backend's `gameContextSchema`. */
export type GameState = {
  playerCount: number;
  players: Array<Record<string, unknown>>;
  turnPhase: string;
  selectedZones: string[];
  zones?: Partial<Record<string, GameStateCard[]>>;
  [key: string]: unknown;
};

export type GoldCase = {
  id: string;
  formatVersion: 2;
  tier: CaseTier;
  review: { status: ReviewStatus; reviewedOn: string | null; note?: string };
  cards: AttachedCard[];
  gameState: GameState | null;
  question: string;
  expected: { outcome: CaseOutcome; shortAnswer: string; answer: string; decidingRuleIds: string[] };
  source: Record<string, unknown> & { authority: string };
  layers: { requiredFacts: unknown[]; irrelevantFacts: unknown[]; variants: unknown[] };
  snapshot: {
    ruleIndexHash: string;
    dependsOnHashes: Record<SnapshotDependency, string>;
  };
  whyHard: string;
  /** Derived by the loader; never written in a case file. */
  tags?: string[];
  difficulty?: { cardCount: number; sectionCount: number; flags: string[]; score: number };
};

export type CaseRequest =
  | { mode: "lookup"; question: string; cards?: Array<{ cardId: string; name: string }> }
  | { mode: "game"; question: string; gameContext: unknown };

export type SnapshotSources = {
  ruleIndexHash: string;
  ruleText(ruleId: string): string | null;
  oracleText(oracleId: string): string | null;
  rulings(oracleId: string): Array<{ publishedAt: string; comment: string }>;
};

export type DependencyTexts = {
  rules: Array<{ ruleId: string; text: string | null }>;
  oracle: Array<{ oracleId: string; name: string; text: string | null }>;
  rulings: Array<{ oracleId: string; name: string; rulings: Array<{ publishedAt: string; comment: string }> }>;
};

export const CASES_DIR: string;
export const DATA_DIR: string;
export const CASE_FORMAT_VERSION: 2;
export const REVIEW_STATUSES: ReviewStatus[];
export const OUTCOMES: CaseOutcome[];
export const ZONE_IDS: string[];
export const SNAPSHOT_DEPENDENCIES: SnapshotDependency[];
export const SOURCE_POOLS: string[];
export const TIER_AUTHORITIES: Record<CaseTier, string>;
export const REQUIRED_SIX_CASE_IDS: string[];

export function validateGoldCase(caseEntry: unknown, options?: { external?: boolean }): { valid: boolean; errors: string[] };
export const EXTERNAL_TIER: "external";
export const EXTERNAL_AUTHORITY: "external-unapproved";
export function mechanicPrefixes(decidingRuleIds: readonly string[]): string[];
export function ruleSections(decidingRuleIds: readonly string[]): string[];
export function deriveTags(caseEntry: GoldCase): string[];
export function deriveDifficulty(caseEntry: GoldCase): NonNullable<GoldCase["difficulty"]>;
export function sha256(text: string): string;
export function findDuplicateErrors(cases: GoldCase[]): string[];
export function loadSnapshotSources(options?: { dataDir?: string }): Promise<
  SnapshotSources & { ruleIndex: Array<{ ruleId: string; text: string }> }
>;
export function collectDependencyTexts(caseEntry: GoldCase, sources: SnapshotSources): DependencyTexts;
export function computeDependsOnHashes(
  caseEntry: GoldCase,
  sources: SnapshotSources
): Record<SnapshotDependency, string>;
export function computeSnapshot(caseEntry: GoldCase, sources: SnapshotSources): GoldCase["snapshot"];
export function compareSnapshot(
  caseEntry: GoldCase,
  sources: SnapshotSources
): { stale: boolean; changed: SnapshotDependency[] };
export function readCaseFiles(casesDir?: string): Promise<Array<{ fileName: string; case: unknown }>>;
export function loadGoldCases(casesDir?: string, options?: { external?: boolean }): Promise<GoldCase[]>;
