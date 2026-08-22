import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";

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
   * Fetches one variant's detail lazily: a positional read of its recorded
   * byte range in the detail artifact, plus a single `gunzipSync` on just
   * that slice — never the whole ~105k-variant detail file. `undefined` for
   * an unknown id, or one whose bytes fail integrity validation: a corrupt
   * single record disables enrichment for that variant only, not the whole
   * catalog, since the individually-gzipped storage format exists precisely
   * so one variant's bytes never depend on any other's.
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

function assertMembership(value: unknown, label: string): Map<string, string[]> {
  if (!isRecord(value)) {
    throw new Error(`Combo index ${label} must be an object.`);
  }
  const membership = new Map<string, string[]>();
  for (const [oracleId, variantIds] of Object.entries(value)) {
    if (!Array.isArray(variantIds) || variantIds.some((variantId) => typeof variantId !== "string")) {
      throw new Error(`Combo index ${label} entry ${oracleId} must be an array of variant ids.`);
    }
    membership.set(oracleId, variantIds as string[]);
  }
  return membership;
}

type DetailOffset = readonly [offset: number, length: number];

function assertDetailOffsets(value: unknown): Map<string, DetailOffset> {
  if (!isRecord(value)) {
    throw new Error("Combo index detailOffsets must be an object.");
  }
  const offsets = new Map<string, DetailOffset>();
  for (const [variantId, entry] of Object.entries(value)) {
    const [offset, length] = Array.isArray(entry) ? entry : [undefined, undefined];
    if (!Number.isInteger(offset) || !Number.isInteger(length) || (offset as number) < 0 || (length as number) <= 0) {
      throw new Error(`Combo index detailOffsets entry ${variantId} must be a [offset, length] pair.`);
    }
    offsets.set(variantId, [offset as number, length as number]);
  }
  return offsets;
}

function readIndexArtifact(indexPath: string): Record<string, unknown> | null {
  if (!existsSync(indexPath)) {
    warnOnce(indexPath, `Commander Spellbook combo index artifact missing; combo enrichment disabled: ${indexPath}`);
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(gunzipSync(readFileSync(indexPath)).toString("utf8"));
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
 * Read one variant's bytes from the detail artifact at its recorded byte
 * range and decompress just that gzip member. Thrown errors are the caller's
 * signal to fail open for this one variant — never propagated further.
 */
function readVariantDetail(detailPath: string, [offset, length]: DetailOffset): unknown {
  const fd = openSync(detailPath, "r");
  try {
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, offset);
    return JSON.parse(gunzipSync(buffer).toString("utf8"));
  } finally {
    closeSync(fd);
  }
}

/**
 * Load the committed combo artifacts, failing open on every artifact problem.
 * The index (small — oracle/template membership plus the byte-offset
 * directory) is fully validated at load time, since fully validating it costs
 * nothing. The detail artifact (the ~105k-variant corpus) is validated only
 * structurally at load time — its size must cover every offset the index
 * records — and each variant's actual bytes are decompressed and validated
 * lazily, on first fetch. A single corrupt variant record therefore disables
 * enrichment for that variant only, with one warning per process per variant;
 * a missing or structurally-broken index or detail file disables the whole
 * catalog, with one warning per process per path. Nothing here is memoized
 * across calls, so one process can build both an enrichment-enabled and an
 * enrichment-disabled app; each loaded catalog keeps its own small bounded
 * cache of recently-fetched variants (`DETAIL_CACHE_CAPACITY`).
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
  let detailOffsets: Map<string, DetailOffset>;
  try {
    byOracleId = assertMembership(index.byOracleId, "byOracleId");
    byTemplateOracleId = assertMembership(index.byTemplateOracleId, "byTemplateOracleId");
    detailOffsets = assertDetailOffsets(index.detailOffsets);

    const detailSize = statSync(detailPath).size;
    for (const [variantId, [offset, length]] of detailOffsets) {
      if (offset + length > detailSize) {
        throw new Error(`Combo detail artifact is shorter than variant ${variantId}'s recorded byte range.`);
      }
    }
  } catch (error) {
    warnOnce(
      indexPath,
      `Commander Spellbook combo index failed structural validation; combo enrichment disabled: ${indexPath}`,
      error
    );
    return createEmptyComboCatalog();
  }

  const cache = new BoundedVariantCache(DETAIL_CACHE_CAPACITY);

  function getVariant(variantId: string): ComboVariant | undefined {
    const cached = cache.get(variantId);
    if (cached) return cached;

    const offset = detailOffsets.get(variantId);
    if (!offset) return undefined;

    try {
      const variant = assertVariant(readVariantDetail(detailPath, offset));
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
    variantCount: detailOffsets.size,
    getVariant
  };
}
