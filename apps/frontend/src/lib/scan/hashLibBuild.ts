import fs from "node:fs";
import path from "node:path";

export interface PlanCard {
  id: string;
  hasBack: boolean;
}

export interface HashEntry {
  id: string;
  hash: Uint8Array;
}

export type FetchFailureKind = "transient" | "permanent";
export type BudgetStopReason = "limit" | "max-minutes";

export interface BudgetState {
  hashedNew: number;
}

export interface BudgetOptions {
  limit?: number | null;
  maxMinutes?: number | null;
  startedAtMs: number;
}

export interface SkiplistEntry {
  attempts: number;
  parked: boolean;
  lastError: string | null;
}

export type Skiplist = Record<string, SkiplistEntry>;
export type SkiplistOutcome = "permanent" | "success";

export interface BuildTargetOptions {
  output: string;
  manifest: string;
  liveOutput?: string;
  liveManifest?: string;
  fresh?: boolean;
  force?: boolean;
  outputExplicit?: boolean;
  manifestExplicit?: boolean;
  exists?: (filePath: string) => boolean;
}

export interface BuildTargets {
  output: string;
  manifest: string;
  fresh: boolean;
  readExistingOutput: boolean;
}

const BACK_FACE_SUFFIX = "__back";
const CARD_BACK_ID = "_card_back";
const CARDHASHES_BASENAME = "cardhashes.bin";
const CARDHASH_MANIFEST_BASENAME = "cardhashManifest.json";
const DEFAULT_BACKOFF_BASE_MS = 500;
const DEFAULT_BACKOFF_CAP_MS = 30_000;

export function planTargetEntryIds(cards: PlanCard[], opts?: { hasCardBackReference?: boolean }): string[] {
  const ids = new Set<string>();
  for (const card of cards) {
    ids.add(card.id);
    if (card.hasBack) ids.add(`${card.id}${BACK_FACE_SUFFIX}`);
  }
  if (opts?.hasCardBackReference) ids.add(CARD_BACK_ID);
  return Array.from(ids).sort();
}

export function diffMissingEntries(
  targetIds: string[],
  existingIds: Iterable<string>,
  parkedIds: Iterable<string>,
  opts?: { retryParked?: boolean }
): string[] {
  const existing = new Set(existingIds);
  const parked = opts?.retryParked ? new Set<string>() : new Set(parkedIds);
  return targetIds.filter((id) => !existing.has(id) && !parked.has(id));
}

export function mergeEntries(existingEntries: HashEntry[], newEntries: HashEntry[]): HashEntry[] {
  const merged: HashEntry[] = [];
  const seen = new Set<string>();

  for (const entry of existingEntries) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }

  for (const entry of newEntries) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }

  return merged;
}

export function evaluateBudget(
  state: BudgetState,
  { limit, maxMinutes, startedAtMs }: BudgetOptions,
  nowMs = Date.now()
): { stop: boolean; reason: BudgetStopReason | null } {
  if (typeof limit === "number" && state.hashedNew >= limit) {
    return { stop: true, reason: "limit" };
  }

  if (typeof maxMinutes === "number" && nowMs - startedAtMs >= maxMinutes * 60_000) {
    return { stop: true, reason: "max-minutes" };
  }

  return { stop: false, reason: null };
}

export function writeFileAtomic(filePath: string, bytes: Uint8Array | string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
  try {
    fs.writeFileSync(tmpPath, bytes);
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    fs.rmSync(tmpPath, { force: true });
    throw error;
  }
}

export function resolveBuildTargets({
  output,
  manifest,
  liveOutput,
  liveManifest,
  fresh = false,
  force = false,
  outputExplicit = false,
  manifestExplicit = false,
  exists = fs.existsSync
}: BuildTargetOptions): BuildTargets {
  if (!fresh) {
    return { output, manifest, fresh: false, readExistingOutput: true };
  }

  const freshOutput = outputExplicit ? output : defaultFreshOutputPath(output);
  const freshManifest = manifestExplicit
    ? manifest
    : outputExplicit
      ? deriveManifestPathForOutput(freshOutput)
      : defaultFreshManifestPath(manifest);

  if (!force && !outputExplicit) {
    const clobbered = [freshOutput, freshManifest].filter((filePath) => exists(filePath));
    if (clobbered.length > 0) {
      throw new Error(
        `--fresh target already exists: ${clobbered.join(", ")}. Pass --force or choose --output <path>.`
      );
    }
  }

  const resolvedFreshOutput = path.resolve(freshOutput);
  const resolvedFreshManifest = path.resolve(freshManifest);
  if (liveOutput && resolvedFreshOutput === path.resolve(liveOutput)) {
    throw new Error("--fresh cannot write the live cardhashes.bin path; choose a separate --output target.");
  }
  if (liveManifest && resolvedFreshManifest === path.resolve(liveManifest)) {
    throw new Error("--fresh cannot write the live cardhashManifest.json path; choose a separate --manifest target.");
  }

  return { output: freshOutput, manifest: freshManifest, fresh: true, readExistingOutput: false };
}

export function applySkiplistOutcome(
  skiplist: Skiplist,
  id: string,
  outcome: SkiplistOutcome,
  { parkThreshold, error }: { parkThreshold: number; error?: string | null }
): Skiplist {
  const next = { ...skiplist };

  if (outcome === "success") {
    delete next[id];
    return next;
  }

  const existing = next[id];
  const attempts = (existing?.attempts ?? 0) + 1;
  next[id] = {
    attempts,
    parked: attempts >= parkThreshold,
    lastError: error ?? existing?.lastError ?? null
  };
  return next;
}

export function readSkiplist(filePath: string): Skiplist {
  if (!fs.existsSync(filePath)) return {};

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const skiplist: Skiplist = {};
  if (typeof raw !== "object" || raw === null) return skiplist;

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) continue;
    const entry = value as { attempts?: unknown; parked?: unknown; lastError?: unknown };
    skiplist[id] = {
      attempts: typeof entry.attempts === "number" ? entry.attempts : 0,
      parked: Boolean(entry.parked),
      lastError: typeof entry.lastError === "string" ? entry.lastError : null
    };
  }
  return skiplist;
}

export function serializeSkiplist(skiplist: Skiplist): string {
  return `${JSON.stringify(skiplist, null, 2)}\n`;
}

export function classifyFetchFailure(status: number | null | undefined, error?: unknown): FetchFailureKind {
  if (status === 429 || (typeof status === "number" && status >= 500 && status <= 599)) {
    return "transient";
  }
  if (typeof status === "number" && status >= 400 && status <= 499) {
    return "permanent";
  }

  if (isMarkedPermanent(error) || /decode|dimension|Expected canonical/i.test(errorMessage(error))) {
    return "permanent";
  }
  return "transient";
}

export function backoffDelayMs(attempt: number, retryAfterMs?: number | null): number {
  if (typeof retryAfterMs === "number" && Number.isFinite(retryAfterMs) && retryAfterMs > 0) {
    return Math.min(retryAfterMs, DEFAULT_BACKOFF_CAP_MS);
  }

  const boundedAttempt = Math.max(1, Math.floor(attempt));
  return Math.min(DEFAULT_BACKOFF_BASE_MS * 2 ** (boundedAttempt - 1), DEFAULT_BACKOFF_CAP_MS);
}

export function parseRetryAfterMs(headerValue: string | null | undefined, nowMs = Date.now()): number | null {
  if (typeof headerValue !== "string") return null;
  const trimmed = headerValue.trim();
  if (trimmed.length === 0) return null;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const dateMs = Date.parse(trimmed);
  if (Number.isNaN(dateMs)) return null;
  return Math.max(0, dateMs - nowMs);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function isMarkedPermanent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "permanent" in error && Boolean((error as { permanent?: unknown }).permanent);
}

function defaultFreshOutputPath(output: string): string {
  const parsed = path.parse(output);
  if (parsed.base === CARDHASHES_BASENAME) {
    return path.join(parsed.dir, "cardhashes.fresh.bin");
  }
  return path.join(parsed.dir, `${parsed.name}.fresh${parsed.ext || ".bin"}`);
}

function defaultFreshManifestPath(manifest: string): string {
  const parsed = path.parse(manifest);
  if (parsed.base === CARDHASH_MANIFEST_BASENAME) {
    return path.join(parsed.dir, "cardhashManifest.fresh.json");
  }
  return path.join(parsed.dir, `${parsed.name}.fresh${parsed.ext || ".json"}`);
}

function deriveManifestPathForOutput(output: string): string {
  const parsed = path.parse(output);
  if (parsed.base === "cardhashes.fresh.bin") {
    return path.join(parsed.dir, "cardhashManifest.fresh.json");
  }
  if (parsed.base === CARDHASHES_BASENAME) {
    return path.join(parsed.dir, CARDHASH_MANIFEST_BASENAME);
  }

  const stem = parsed.ext ? parsed.name : parsed.base;
  return path.join(parsed.dir, `${stem}.manifest.json`);
}
