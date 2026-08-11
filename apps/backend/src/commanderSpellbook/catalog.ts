import { existsSync, readFileSync } from "node:fs";

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
  variants: Map<string, ComboVariant>;
  byOracleId: Map<string, string[]>;
  byTemplateOracleId: Map<string, string[]>;
  variantCount: number;
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

export function createEmptyComboCatalog(): ComboCatalog {
  return {
    variants: new Map(),
    byOracleId: new Map(),
    byTemplateOracleId: new Map(),
    variantCount: 0
  };
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

function readArtifact(filePath: string, label: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) {
    warnOnce(filePath, `Commander Spellbook ${label} artifact missing; combo enrichment disabled: ${filePath}`);
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    warnOnce(
      filePath,
      `Commander Spellbook ${label} artifact could not be parsed; combo enrichment disabled: ${filePath}`,
      error
    );
    return null;
  }

  if (!isRecord(parsed)) {
    warnOnce(filePath, `Commander Spellbook ${label} artifact has an unexpected shape; combo enrichment disabled: ${filePath}`);
    return null;
  }

  return parsed;
}

/**
 * Load the committed combo artifacts, failing open on every artifact problem:
 * a missing, empty, malformed, or integrity-violating artifact disables combo
 * enrichment only and warns once per process per path, leaving the normal Ask AI
 * path untouched. Nothing here is memoized, so one process can build both an
 * enrichment-enabled and an enrichment-disabled app.
 */
export function loadComboCatalog(detailPath: string, indexPath: string): ComboCatalog {
  const detail = readArtifact(detailPath, "combo detail");
  if (!detail) return createEmptyComboCatalog();

  const index = readArtifact(indexPath, "combo index");
  if (!index) return createEmptyComboCatalog();

  try {
    if (!Array.isArray(detail.variants)) {
      throw new Error("Combo detail artifact is missing its variants array.");
    }

    const variants = new Map<string, ComboVariant>();
    for (const rawVariant of detail.variants) {
      const variant = assertVariant(rawVariant);
      variants.set(variant.variantId, variant);
    }

    return {
      variants,
      byOracleId: assertMembership(index.byOracleId, "byOracleId"),
      byTemplateOracleId: assertMembership(index.byTemplateOracleId, "byTemplateOracleId"),
      variantCount: variants.size
    };
  } catch (error) {
    warnOnce(
      detailPath,
      `Commander Spellbook artifact failed integrity validation; combo enrichment disabled: ${detailPath}`,
      error
    );
    return createEmptyComboCatalog();
  }
}
