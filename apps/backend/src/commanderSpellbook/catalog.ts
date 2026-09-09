import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";

/**
 * Upstream starting-zone vocabulary (`ZoneLocation` in
 * `spellbook/models/ingredient.py`). Only these six values ever appear.
 */
export type ComboZoneId = "H" | "B" | "C" | "E" | "G" | "L";

/**
 * Card state is stored zone-scoped and never collapsed: an ingredient permitting
 * several zones keeps each zone's state independently. Hand and command carry no
 * state upstream, so they have no key here.
 */
export type ComboCardStateZone = "battlefield" | "exile" | "graveyard" | "library";
export type ComboCardState = Partial<Record<ComboCardStateZone, string>>;

export type ComboCardIngredient = {
  cardId: string;
  cardName: string;
  quantity: number;
  zones: ComboZoneId[];
  cardState: ComboCardState;
  mustBeCommander: boolean;
};

export type ComboTemplateIngredient = {
  templateId: number;
  templateName: string;
  quantity: number;
  zones: ComboZoneId[];
  cardState: ComboCardState;
  mustBeCommander: boolean;
  scryfallApi: string | null;
  unresolved: boolean;
  oracleIds: string[];
};

export type ComboVariant = {
  variantId: string;
  sourceUrl: string;
  popularity: number;
  steps: string;
  manaNeeded: string;
  easyPrerequisites: string;
  notablePrerequisites: string;
  notes: string;
  producedEffects: string[];
  cardIngredients: ComboCardIngredient[];
  templateIngredients: ComboTemplateIngredient[];
};

export type ComboCatalog = {
  byOracleId: Map<string, string[]>;
  byTemplateOracleId: Map<string, string[]>;
  variantCount: number;
  /**
   * Fetches one variant's detail lazily: a positional read of its block's
   * byte range in the detail artifact, plus a single `brotliDecompressSync`
   * on just that block (never the whole ~105k-variant corpus) followed by a
   * split on newline to the one line this variant occupies. `undefined` for
   * an unknown id, or one whose bytes fail integrity validation: a corrupt
   * single record disables enrichment for that variant only, not the whole
   * catalog, since the block layout exists precisely so one variant's bytes
   * never depend on any other variant's — only on the ~127 variants sharing
   * its block.
   */
  getVariant(variantId: string): ComboVariant | undefined;
};

const ZONE_IDS: readonly ComboZoneId[] = ["H", "B", "C", "E", "G", "L"];
const CARD_STATE_ZONES: readonly ComboCardStateZone[] = ["battlefield", "exile", "graveyard", "library"];

/**
 * Editorial fields upstream nulls only for EXAMPLE variants. The corpus is
 * OK-only, so a null here means the artifact is corrupt, not that the data is
 * merely thin — the loader disables enrichment rather than skipping the variant.
 */
const REQUIRED_VARIANT_TEXT_FIELDS = [
  "steps",
  "manaNeeded",
  "easyPrerequisites",
  "notablePrerequisites",
  "notes"
] as const;

const warnedLoadFailures = new Set<string>();

function warnOnce(filePath: string, message: string, error?: unknown): void {
  if (warnedLoadFailures.has(filePath)) return;
  warnedLoadFailures.add(filePath);
  if (error) {
    console.warn(message, error);
  } else {
    console.warn(message);
  }
}

function createEmptyComboCatalog(): ComboCatalog {
  return {
    byOracleId: new Map(),
    byTemplateOracleId: new Map(),
    variantCount: 0,
    getVariant: () => undefined
  };
}

/**
 * At most this many decompressed variants are held per loaded catalog. At
 * most five variants ever enter one prompt, so this generously covers a warm
 * process answering many requests without approaching the eager-load memory
 * cost (~868MB RSS, DEC-162) this format exists to avoid. Least-recently-used
 * eviction: `Map` insertion order is reuse order here, so the oldest key is
 * always `entries.keys().next().value`.
 */
const DETAIL_CACHE_CAPACITY = 64;

class BoundedVariantCache {
  private readonly entries = new Map<string, ComboVariant>();

  constructor(private readonly capacity: number) {}

  get(variantId: string): ComboVariant | undefined {
    const value = this.entries.get(variantId);
    if (value === undefined) return undefined;
    this.entries.delete(variantId);
    this.entries.set(variantId, value);
    return value;
  }

  set(variantId: string, value: ComboVariant): void {
    this.entries.delete(variantId);
    this.entries.set(variantId, value);
    if (this.entries.size > this.capacity) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) this.entries.delete(oldestKey);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertCardState(value: unknown, context: string): ComboCardState {
  if (!isRecord(value)) {
    throw new Error(`${context}: cardState must be an object.`);
  }
  const cardState: ComboCardState = {};
  for (const zone of CARD_STATE_ZONES) {
    if (!(zone in value)) continue;
    const state = value[zone];
    if (typeof state !== "string") {
      throw new Error(`${context}: ${zone} card state must be a string.`);
    }
    cardState[zone] = state;
  }
  return cardState;
}

function assertZones(value: unknown, context: string): ComboZoneId[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${context}: zones must be a non-empty array.`);
  }
  for (const zone of value) {
    if (!ZONE_IDS.includes(zone as ComboZoneId)) {
      throw new Error(`${context}: unrecognized zone "${String(zone)}".`);
    }
  }
  return value as ComboZoneId[];
}

function assertQuantity(value: unknown, context: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`${context}: quantity must be a positive integer.`);
  }
  return value as number;
}

function assertCardIngredient(value: unknown, context: string): ComboCardIngredient {
  if (!isRecord(value)) throw new Error(`${context}: card ingredient must be an object.`);
  if (typeof value.cardId !== "string" || value.cardId.length === 0) {
    throw new Error(`${context}: cardId is required.`);
  }
  if (typeof value.cardName !== "string" || value.cardName.length === 0) {
    throw new Error(`${context}: cardName is required.`);
  }
  return {
    cardId: value.cardId,
    cardName: value.cardName,
    quantity: assertQuantity(value.quantity, `${context} ${value.cardId}`),
    zones: assertZones(value.zones, `${context} ${value.cardId}`),
    cardState: assertCardState(value.cardState, `${context} ${value.cardId}`),
    mustBeCommander: value.mustBeCommander === true
  };
}

function assertTemplateIngredient(value: unknown, context: string): ComboTemplateIngredient {
  if (!isRecord(value)) throw new Error(`${context}: template ingredient must be an object.`);
  if (!Number.isInteger(value.templateId)) {
    throw new Error(`${context}: templateId is required.`);
  }
  const templateId = value.templateId as number;
  if (typeof value.templateName !== "string" || value.templateName.length === 0) {
    throw new Error(`${context} ${templateId}: templateName is required.`);
  }
  const oracleIds = Array.isArray(value.oracleIds) ? value.oracleIds : [];
  for (const oracleId of oracleIds) {
    if (typeof oracleId !== "string") {
      throw new Error(`${context} ${templateId}: oracleIds must contain only strings.`);
    }
  }

  return {
    templateId,
    templateName: value.templateName,
    quantity: assertQuantity(value.quantity, `${context} ${templateId}`),
    zones: assertZones(value.zones, `${context} ${templateId}`),
    cardState: assertCardState(value.cardState, `${context} ${templateId}`),
    mustBeCommander: value.mustBeCommander === true,
    scryfallApi: typeof value.scryfallApi === "string" ? value.scryfallApi : null,
    unresolved: value.unresolved === true,
    oracleIds: oracleIds as string[]
  };
}

function assertVariant(value: unknown): ComboVariant {
  if (!isRecord(value)) throw new Error("Combo variant must be an object.");
  if (typeof value.variantId !== "string" || value.variantId.length === 0) {
    throw new Error("Combo variant is missing variantId.");
  }
  const context = `Combo variant ${value.variantId}`;

  const variant = {
    variantId: value.variantId,
    sourceUrl: typeof value.sourceUrl === "string" ? value.sourceUrl : "",
    popularity: Number.isInteger(value.popularity) ? (value.popularity as number) : 0,
    producedEffects: Array.isArray(value.producedEffects)
      ? value.producedEffects.filter((effect): effect is string => typeof effect === "string")
      : []
  } as ComboVariant;

  for (const field of REQUIRED_VARIANT_TEXT_FIELDS) {
    const fieldValue = value[field];
    if (typeof fieldValue !== "string") {
      throw new Error(`${context}: ${field} must be a string; the corpus is OK-only so a null here is corrupt.`);
    }
    variant[field] = fieldValue;
  }

  if (!Array.isArray(value.cardIngredients) || value.cardIngredients.length === 0) {
    throw new Error(`${context}: cardIngredients must be a non-empty array.`);
  }
  variant.cardIngredients = value.cardIngredients.map((ingredient) =>
    assertCardIngredient(ingredient, `${context} card ingredient`)
  );

  const templateIngredients = Array.isArray(value.templateIngredients) ? value.templateIngredients : [];
  variant.templateIngredients = templateIngredients.map((ingredient) =>
    assertTemplateIngredient(ingredient, `${context} template ingredient`)
  );

  return variant;
}

/**
 * Membership lists are written as arrays of integer positions into the
 * index's `variantIds` positional dictionary (slice E), not variant-id
 * strings — the compaction that drops cold-start parsing of the index from
 * ~47 MB to ~12 MB. Validated here as positions only; `loadComboCatalog`
 * maps them back to variant-id strings once `variantIds` itself is known, so
 * the `ComboCatalog` this module exposes still carries `Map<string, string[]>`
 * — a wire-format change absorbed entirely at load, invisible to every
 * consumer of `byOracleId` / `byTemplateOracleId`.
 */
function assertPositionMembership(value: unknown, label: string): Map<string, number[]> {
  if (!isRecord(value)) {
    throw new Error(`Combo index ${label} must be an object.`);
  }
  const membership = new Map<string, number[]>();
  for (const [oracleId, positions] of Object.entries(value)) {
    if (!Array.isArray(positions) || positions.some((position) => !Number.isInteger(position) || position < 0)) {
      throw new Error(`Combo index ${label} entry ${oracleId} must be an array of non-negative integer positions.`);
    }
    membership.set(oracleId, positions as number[]);
  }
  return membership;
}

type BlockRange = { offset: number; length: number };

function assertBlockDirectory(value: unknown): BlockRange[] {
  if (!Array.isArray(value)) {
    throw new Error("Combo index blocks must be an array.");
  }
  return value.map((entry, blockIndex) => {
    if (
      !isRecord(entry) ||
      !Number.isInteger(entry.offset) ||
      !Number.isInteger(entry.length) ||
      (entry.offset as number) < 0 ||
      (entry.length as number) <= 0
    ) {
      throw new Error(`Combo index blocks[${blockIndex}] must be an { offset, length } pair.`);
    }
    return { offset: entry.offset as number, length: entry.length as number };
  });
}

/** `variantIds`: every committed variant id, listed exactly once, in `variantId` order — a variant's array index is its position everywhere else in the index. */
function assertVariantIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((variantId) => typeof variantId !== "string")) {
    throw new Error("Combo index variantIds must be an array of strings.");
  }
  return value as string[];
}

function readIndexArtifact(indexPath: string): Record<string, unknown> | null {
  if (!existsSync(indexPath)) {
    warnOnce(indexPath, `Commander Spellbook combo index artifact missing; combo enrichment disabled: ${indexPath}`);
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(brotliDecompressSync(readFileSync(indexPath)).toString("utf8"));
  } catch (error) {
    warnOnce(
      indexPath,
      `Commander Spellbook combo index artifact could not be read; combo enrichment disabled: ${indexPath}`,
      error
    );
    return null;
  }

  if (!isRecord(parsed)) {
    warnOnce(indexPath, `Commander Spellbook combo index artifact has an unexpected shape; combo enrichment disabled: ${indexPath}`);
    return null;
  }

  return parsed;
}

/**
 * Read one variant's line from its block, given the block directory and the
 * variant's integer position. `position >> 7` is the block index, `position &
 * 127` the line within it (valid because the build groups variants into
 * fixed blocks of 128 = 2**7). Reads only that block's byte range from disk,
 * brotli-decodes just that block, and parses the one NDJSON line it needs.
 */
function readVariantAtPosition(
  detailPath: string,
  blockDirectory: BlockRange[],
  position: number,
  blockCache: { blockIndex: number; lines: string[] } | null
): { value: unknown; blockCache: { blockIndex: number; lines: string[] } } {
  const blockIndex = position >> 7;
  const lineIndex = position & 127;

  if (blockCache && blockCache.blockIndex === blockIndex) {
    return { value: JSON.parse(blockCache.lines[lineIndex]), blockCache };
  }

  const block = blockDirectory[blockIndex];
  if (!block) {
    throw new Error(`No block at index ${blockIndex} for position ${position}.`);
  }

  const fd = openSync(detailPath, "r");
  let buffer: Buffer;
  try {
    buffer = Buffer.alloc(block.length);
    readSync(fd, buffer, 0, block.length, block.offset);
  } finally {
    closeSync(fd);
  }

  const lines = brotliDecompressSync(buffer).toString("utf8").split("\n");
  const nextCache = { blockIndex, lines };
  return { value: JSON.parse(lines[lineIndex]), blockCache: nextCache };
}

/**
 * Load the committed combo artifacts, failing open on every artifact problem.
 * The index (small — oracle/template membership plus the block/position
 * directories) is fully validated at load time, since fully validating it
 * costs nothing. The detail artifact (the ~105k-variant corpus, in 128-variant
 * blocks) is validated only structurally at load time — every block's byte
 * range must fit inside the file — and each variant's actual bytes are
 * decompressed and validated lazily, on first fetch. A single corrupt variant
 * record therefore disables enrichment for that variant only, with one
 * warning per process per variant; a missing or structurally-broken index or
 * detail file disables the whole catalog, with one warning per process per
 * path. Nothing here is memoized across calls, so one process can build both
 * an enrichment-enabled and an enrichment-disabled app; each loaded catalog
 * keeps its own small bounded cache of recently-fetched variants
 * (`DETAIL_CACHE_CAPACITY`) plus the single most recently decoded block, since
 * up to five combos can enter one prompt and adjacent lookups may share a
 * block.
 */
export function loadComboCatalog(detailPath: string, indexPath: string): ComboCatalog {
  if (!existsSync(detailPath)) {
    warnOnce(detailPath, `Commander Spellbook combo detail artifact missing; combo enrichment disabled: ${detailPath}`);
    return createEmptyComboCatalog();
  }

  const index = readIndexArtifact(indexPath);
  if (!index) return createEmptyComboCatalog();

  let byOracleId: Map<string, string[]>;
  let byTemplateOracleId: Map<string, string[]>;
  let blockDirectory: BlockRange[];
  let variantIds: string[];
  let variantPositions: Map<string, number>;
  try {
    const byOracleIdPositions = assertPositionMembership(index.byOracleId, "byOracleId");
    const byTemplateOracleIdPositions = assertPositionMembership(index.byTemplateOracleId, "byTemplateOracleId");
    blockDirectory = assertBlockDirectory(index.blocks);
    variantIds = assertVariantIds(index.variantIds);
    variantPositions = new Map(variantIds.map((variantId, position) => [variantId, position]));

    const detailSize = statSync(detailPath).size;
    for (const { offset, length } of blockDirectory) {
      if (offset < 0 || offset + length > detailSize) {
        throw new Error(`Combo detail artifact is shorter than a recorded block's byte range.`);
      }
    }
    const blockCount = blockDirectory.length;
    const positionToVariantId = (label: string) => (position: number): string => {
      const variantId = variantIds[position];
      if (variantId === undefined) {
        throw new Error(`Combo index ${label} references position ${position}, outside variantIds.`);
      }
      if (position >> 7 >= blockCount) {
        throw new Error(`Combo index variantIds entry ${variantId} (position ${position}) has no matching block.`);
      }
      return variantId;
    };
    const toStringMembership = (positions: Map<string, number[]>, label: string): Map<string, string[]> => {
      const membership = new Map<string, string[]>();
      const resolve = positionToVariantId(label);
      for (const [oracleId, positionList] of positions) {
        membership.set(oracleId, positionList.map(resolve));
      }
      return membership;
    };

    byOracleId = toStringMembership(byOracleIdPositions, "byOracleId");
    byTemplateOracleId = toStringMembership(byTemplateOracleIdPositions, "byTemplateOracleId");
  } catch (error) {
    warnOnce(
      indexPath,
      `Commander Spellbook combo index failed structural validation; combo enrichment disabled: ${indexPath}`,
      error
    );
    return createEmptyComboCatalog();
  }

  const cache = new BoundedVariantCache(DETAIL_CACHE_CAPACITY);
  let blockCache: { blockIndex: number; lines: string[] } | null = null;

  function getVariant(variantId: string): ComboVariant | undefined {
    const cached = cache.get(variantId);
    if (cached) return cached;

    const position = variantPositions.get(variantId);
    if (position === undefined) return undefined;

    try {
      const read = readVariantAtPosition(detailPath, blockDirectory, position, blockCache);
      blockCache = read.blockCache;
      const variant = assertVariant(read.value);
      cache.set(variantId, variant);
      return variant;
    } catch (error) {
      warnOnce(
        `${detailPath}#${variantId}`,
        `Commander Spellbook combo variant ${variantId} failed integrity validation; that variant is skipped: ${detailPath}`,
        error
      );
      return undefined;
    }
  }

  return {
    byOracleId,
    byTemplateOracleId,
    variantCount: variantPositions.size,
    getVariant
  };
}
