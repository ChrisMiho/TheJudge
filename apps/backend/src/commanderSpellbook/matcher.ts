import type { ZoneId } from "../types/index.js";
import type {
  ComboCardIngredient,
  ComboCardState,
  ComboCatalog,
  ComboTemplateIngredient,
  ComboVariant,
  ComboZoneId
} from "./catalog.js";
import { COMBO_ZONE_ORDER, COMBO_ZONE_TO_CARD_STATE_ZONE, toComboZone } from "./zones.js";

export const MAX_COMBO_CANDIDATES = 5;

/**
 * One submitted card occurrence. Identity is positional — it comes from the
 * submitted context, not from `cardId` — so two copies of the same card are two
 * distinct instances and one instance can never fill two ingredient slots.
 */
export type ComboMatchInstance = {
  instanceId: string;
  cardId: string;
  cardName: string;
  /**
   * Omitted when the request carries no zone information — a lookup-mode
   * attached card is a card the user is asking about, not a card observed
   * somewhere on a board. Such an instance matches on identity alone and
   * reports the ingredient's expected zone state rather than a verified one.
   */
  zone?: ZoneId;
};

export type ComboAnnotationKind =
  | "compatible-present"
  | "wrong-zone"
  | "missing-exact"
  | "matched-template"
  | "unresolved-template";

export type ComboIngredientAnnotation = {
  kind: ComboAnnotationKind;
  label: string;
  isTemplate: boolean;
  quantityRequired: number;
  quantitySatisfied: number;
  permittedZones: ComboZoneId[];
  /** Where the assigned instances actually sit, for a satisfied ingredient. */
  occupiedZones: ComboZoneId[];
  /**
   * Where wrongly zoned instances actually sit, in TheJudge's zone vocabulary —
   * which unlike Commander Spellbook's can express `stack`.
   */
  wrongZones: ZoneId[];
  /** The zone whose state is being reported: occupied when present, expected otherwise. */
  stateZone: ComboZoneId | null;
  cardState?: string;
  mustBeCommander: boolean;
  matchedInstanceIds: string[];
};

export type ComboCandidate = {
  variant: ComboVariant;
  /**
   * Internal vocabulary only. The rendered prompt classification must never use
   * the bare word "complete" (slice D), because nothing here validates card
   * state, so "fully assigned" is the strongest honest claim.
   */
  fullyAssigned: boolean;
  annotations: ComboIngredientAnnotation[];
  missingCount: number;
  compatibleZoneCount: number;
  anchorCoverage: number;
  /**
   * REQ-167 / REQ-094 (amended): count of distinct submitted card ids matched
   * by this candidate's annotations. Used to rank `mode: "lookup"` candidates
   * by how many of the attached cards a candidate actually uses, ahead of
   * popularity. Computed for every mode; only lookup ranks on it.
   */
  attachedCardCoverage: number;
};

export type ComboMatchRequest = {
  mode: "game" | "lookup";
  /**
   * Every submitted card occurrence. For `mode: "lookup"` these are the
   * attached cards (REQ-167) — a bounded set of at most five, each carrying no
   * zone, since a looked-up card is a card the user is asking about, not a
   * card observed somewhere on a board.
   */
  instances: ComboMatchInstance[];
  questionText: string;
  hasExplicitIntent: boolean;
};

type InstancePool = {
  byCardId: Map<string, ComboMatchInstance[]>;
  consumed: Set<string>;
};

function createInstancePool(instances: ComboMatchInstance[]): InstancePool {
  const byCardId = new Map<string, ComboMatchInstance[]>();
  for (const instance of instances) {
    const existing = byCardId.get(instance.cardId);
    if (existing) existing.push(instance);
    else byCardId.set(instance.cardId, [instance]);
  }
  return { byCardId, consumed: new Set() };
}

function availableInstances(pool: InstancePool, cardIds: readonly string[]): ComboMatchInstance[] {
  const available: ComboMatchInstance[] = [];
  for (const cardId of cardIds) {
    for (const instance of pool.byCardId.get(cardId) ?? []) {
      if (!pool.consumed.has(instance.instanceId)) available.push(instance);
    }
  }
  return available;
}

function isZoneCompatible(instance: ComboMatchInstance, permittedZones: readonly ComboZoneId[]): boolean {
  if (instance.zone === undefined) return true;
  const comboZone = toComboZone(instance.zone);
  return comboZone !== null && permittedZones.includes(comboZone);
}

function instanceComboZone(instance: ComboMatchInstance): ComboZoneId | null {
  return instance.zone === undefined ? null : toComboZone(instance.zone);
}

/**
 * The zone whose card state a wrong-zone or missing annotation should report:
 * the first permitted zone that actually carries state, so the model sees what
 * the ingredient would require. Falls back to the first permitted zone.
 */
function expectedStateZone(permittedZones: readonly ComboZoneId[], cardState: ComboCardState): ComboZoneId | null {
  for (const zone of COMBO_ZONE_ORDER) {
    if (!permittedZones.includes(zone)) continue;
    const stateZone = COMBO_ZONE_TO_CARD_STATE_ZONE[zone];
    if (stateZone && cardState[stateZone]) return zone;
  }
  return permittedZones.find((zone) => COMBO_ZONE_ORDER.includes(zone)) ?? null;
}

function stateForZone(zone: ComboZoneId | null, cardState: ComboCardState): string | undefined {
  if (!zone) return undefined;
  const stateZone = COMBO_ZONE_TO_CARD_STATE_ZONE[zone];
  return stateZone ? cardState[stateZone] : undefined;
}

type IngredientSpec = {
  label: string;
  isTemplate: boolean;
  quantity: number;
  zones: ComboZoneId[];
  cardState: ComboCardState;
  mustBeCommander: boolean;
  /** Oracle ids that can satisfy this ingredient. */
  candidateCardIds: readonly string[];
  unresolved: boolean;
};

function cardIngredientSpec(ingredient: ComboCardIngredient): IngredientSpec {
  return {
    label: ingredient.cardName,
    isTemplate: false,
    quantity: ingredient.quantity,
    zones: ingredient.zones,
    cardState: ingredient.cardState,
    mustBeCommander: ingredient.mustBeCommander,
    candidateCardIds: [ingredient.cardId],
    unresolved: false
  };
}

function templateIngredientSpec(ingredient: ComboTemplateIngredient): IngredientSpec {
  return {
    label: ingredient.templateName,
    isTemplate: true,
    quantity: ingredient.quantity,
    zones: ingredient.zones,
    cardState: ingredient.cardState,
    mustBeCommander: ingredient.mustBeCommander,
    candidateCardIds: ingredient.oracleIds,
    unresolved: ingredient.unresolved
  };
}

function annotateIngredient(spec: IngredientSpec, pool: InstancePool): ComboIngredientAnnotation {
  const base = {
    label: spec.label,
    isTemplate: spec.isTemplate,
    quantityRequired: spec.quantity,
    permittedZones: spec.zones,
    mustBeCommander: spec.mustBeCommander
  };

  // An unresolved template has no authoritative card list, so it can never be
  // satisfied and never lets a candidate be fully assigned.
  if (spec.unresolved) {
    const stateZone = expectedStateZone(spec.zones, spec.cardState);
    return {
      ...base,
      kind: "unresolved-template",
      quantitySatisfied: 0,
      occupiedZones: [],
      wrongZones: [],
      stateZone,
      cardState: stateForZone(stateZone, spec.cardState),
      matchedInstanceIds: []
    };
  }

  const available = availableInstances(pool, spec.candidateCardIds);
  const compatible = available.filter((instance) => isZoneCompatible(instance, spec.zones));
  const assigned = compatible.slice(0, spec.quantity);
  for (const instance of assigned) pool.consumed.add(instance.instanceId);

  const occupiedZones: ComboZoneId[] = [];
  for (const instance of assigned) {
    const zone = instanceComboZone(instance);
    if (zone && !occupiedZones.includes(zone)) occupiedZones.push(zone);
  }

  if (assigned.length === spec.quantity) {
    // State is reported for the zone the matched instance actually occupies; with
    // no zone information, the ingredient's expected zone state is reported.
    const stateZone = occupiedZones[0] ?? expectedStateZone(spec.zones, spec.cardState);
    return {
      ...base,
      kind: spec.isTemplate ? "matched-template" : "compatible-present",
      quantitySatisfied: assigned.length,
      occupiedZones,
      wrongZones: [],
      stateZone,
      cardState: stateForZone(stateZone, spec.cardState),
      matchedInstanceIds: assigned.map((instance) => instance.instanceId)
    };
  }

  // Short of the required quantity. Instances of the right card in the wrong
  // zone are reported as wrongly zoned rather than silently absent.
  const wronglyZoned = available.filter(
    (instance) => !isZoneCompatible(instance, spec.zones) && !pool.consumed.has(instance.instanceId)
  );
  const wrongZones: ZoneId[] = [];
  for (const instance of wronglyZoned) {
    if (instance.zone !== undefined && !wrongZones.includes(instance.zone)) wrongZones.push(instance.zone);
  }

  const stateZone = expectedStateZone(spec.zones, spec.cardState);
  return {
    ...base,
    kind: wronglyZoned.length > 0 ? "wrong-zone" : "missing-exact",
    quantitySatisfied: assigned.length,
    occupiedZones,
    wrongZones,
    stateZone,
    cardState: stateForZone(stateZone, spec.cardState),
    matchedInstanceIds: assigned.map((instance) => instance.instanceId)
  };
}

function buildCandidate(variant: ComboVariant, request: ComboMatchRequest, anchorCardIds: Set<string>): ComboCandidate {
  const pool = createInstancePool(request.instances);
  const instanceCardId = new Map(request.instances.map((instance) => [instance.instanceId, instance.cardId]));

  // Exact ingredients claim their instances before templates, so a card that is
  // both a named ingredient and a template member fills the named slot.
  const annotations = [
    ...variant.cardIngredients.map((ingredient) => annotateIngredient(cardIngredientSpec(ingredient), pool)),
    ...variant.templateIngredients.map((ingredient) => annotateIngredient(templateIngredientSpec(ingredient), pool))
  ];

  const missingCount = annotations.reduce(
    (total, annotation) => total + (annotation.quantityRequired - annotation.quantitySatisfied),
    0
  );
  const compatibleZoneCount = annotations.reduce((total, annotation) => total + annotation.quantitySatisfied, 0);
  const anchorCoverage = variant.cardIngredients.filter((ingredient) => anchorCardIds.has(ingredient.cardId)).length;

  const matchedCardIds = new Set<string>();
  for (const annotation of annotations) {
    for (const instanceId of annotation.matchedInstanceIds) {
      const cardId = instanceCardId.get(instanceId);
      if (cardId) matchedCardIds.add(cardId);
    }
  }

  return {
    variant,
    fullyAssigned: missingCount === 0,
    annotations,
    missingCount,
    compatibleZoneCount,
    anchorCoverage,
    attachedCardCoverage: matchedCardIds.size
  };
}

/**
 * Submitted card names the question mentions become required anchors for partial
 * candidates, so an explicit "does X combo with anything?" cannot drag in
 * unrelated staples that merely happen to be on the board.
 */
export function resolveAnchorCardIds(instances: ComboMatchInstance[], questionText: string): Set<string> {
  const normalizedQuestion = questionText.toLowerCase().replace(/\s+/g, " ");
  const anchors = new Set<string>();
  for (const instance of instances) {
    const name = instance.cardName.toLowerCase().replace(/\s+/g, " ").trim();
    if (name.length > 0 && normalizedQuestion.includes(name)) anchors.add(instance.cardId);
  }
  return anchors;
}

function collectCandidateVariantIds(catalog: ComboCatalog, cardIds: readonly string[]): string[] {
  const variantIds = new Set<string>();
  for (const cardId of cardIds) {
    for (const variantId of catalog.byOracleId.get(cardId) ?? []) variantIds.add(variantId);
    for (const variantId of catalog.byTemplateOracleId.get(cardId) ?? []) variantIds.add(variantId);
  }
  return [...variantIds];
}

function compareCandidates(a: ComboCandidate, b: ComboCandidate): number {
  if (a.fullyAssigned !== b.fullyAssigned) return a.fullyAssigned ? -1 : 1;
  if (a.anchorCoverage !== b.anchorCoverage) return b.anchorCoverage - a.anchorCoverage;
  if (a.compatibleZoneCount !== b.compatibleZoneCount) return b.compatibleZoneCount - a.compatibleZoneCount;
  if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
  if (a.variant.popularity !== b.variant.popularity) return b.variant.popularity - a.variant.popularity;
  return a.variant.variantId.localeCompare(b.variant.variantId);
}

/**
 * REQ-094 (amended by REQ-167): lookup carries no zones, so the two zone-based
 * coverage terms `compareCandidates` uses collapse into one lookup analog —
 * attached-card coverage. Order: complete before partial; attached-card
 * coverage descending; fewer missing ingredients; popularity descending;
 * variant id ascending. With exactly one attached card, coverage is uniform
 * across candidates, so ordering reduces to exactly what `compareCandidates`
 * already produces for a single attached card.
 */
function compareLookupCandidates(a: ComboCandidate, b: ComboCandidate): number {
  if (a.fullyAssigned !== b.fullyAssigned) return a.fullyAssigned ? -1 : 1;
  if (a.attachedCardCoverage !== b.attachedCardCoverage) return b.attachedCardCoverage - a.attachedCardCoverage;
  if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
  if (a.variant.popularity !== b.variant.popularity) return b.variant.popularity - a.variant.popularity;
  return a.variant.variantId.localeCompare(b.variant.variantId);
}

/**
 * Turn a submitted request plus the loaded catalog into at most five ranked,
 * fully annotated candidates. No model call decides intent, eligibility,
 * template satisfaction, or ranking, and nothing here validates legality, board
 * legality, or executability (DEC-013).
 */
export function selectComboCandidates(catalog: ComboCatalog, request: ComboMatchRequest): ComboCandidate[] {
  if (catalog.variantCount === 0) return [];

  if (request.mode === "lookup") {
    // Lookup retrieval requires both explicit intent and at least one
    // attached card (REQ-167: the bounded attached-card set replaces the
    // single attached card as the match instances).
    if (!request.hasExplicitIntent || request.instances.length === 0) return [];
  }

  // REQ-167: for lookup, every attached card is a search id — qualify-on-any-one
  // is achieved structurally here, since a candidate only appears when the
  // catalog membership scan below finds at least one attached card in it.
  const searchCardIds = [...new Set(request.instances.map((instance) => instance.cardId))];
  if (searchCardIds.length === 0) return [];

  const anchorCardIds = resolveAnchorCardIds(request.instances, request.questionText);

  const candidates = collectCandidateVariantIds(catalog, searchCardIds)
    .map((variantId) => catalog.getVariant(variantId))
    .filter((variant): variant is ComboVariant => variant !== undefined)
    .map((variant) => buildCandidate(variant, request, anchorCardIds));

  const eligible = candidates.filter((candidate) => {
    if (candidate.fullyAssigned) return true;
    // Partial candidates need explicit intent in every mode.
    if (!request.hasExplicitIntent) return false;
    // With anchors named, game-mode partials must contain one of them.
    // Lookup partials already satisfy qualify-on-any-one via the catalog scan.
    if (request.mode === "game" && anchorCardIds.size > 0 && candidate.anchorCoverage === 0) return false;
    return true;
  });

  const comparator = request.mode === "lookup" ? compareLookupCandidates : compareCandidates;
  return eligible.sort(comparator).slice(0, MAX_COMBO_CANDIDATES);
}
