import type { ComboCandidate, ComboIngredientAnnotation } from "./matcher.js";
import { comboZoneLabel } from "./zones.js";

export const COMBO_SECTION_HEADING = "COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED";

/**
 * Guardrails rendered with every combo section.
 *
 * Deliberately free of the bare word "complete": nothing in this feature
 * validates card state, zones, legality, or executability, so claiming a combo
 * is "complete" would overstate what the corpus can support. The strongest
 * honest phrasing is that every piece is present and its state is unverified.
 */
export const COMBO_INSTRUCTION_LINES: readonly string[] = Object.freeze([
  "- This is community-maintained catalog data from Commander Spellbook. It is not official WotC rules, not legality validation, and not proof that a combo can actually be executed in this game state.",
  "- Official card text, WotC rulings, and the Comprehensive Rules remain authoritative. Where they disagree with this section, they win.",
  "- For a partial candidate, identify the missing or incorrectly zoned pieces explicitly rather than assuming the user has them.",
  "- A candidate supplied automatically, rather than in response to an explicit combo question, is background context only: use it when it genuinely bears on the question asked, and do not expand it into a survey of unrelated staples.",
  "- Before asserting that a combo is live, assembled, or executable, check each ingredient's applicable card state and its must-be-commander requirement against the submitted board. None of that state has been verified here."
]);

const FULLY_ASSIGNED_CLASSIFICATION = "all pieces present; card state unverified";
const PARTIAL_CLASSIFICATION = "partial; missing pieces named below";

function formatZoneList(zones: readonly string[]): string {
  if (zones.length === 0) return "unspecified";
  if (zones.length === 1) return zones[0]!;
  return `${zones.slice(0, -1).join(", ")} or ${zones[zones.length - 1]}`;
}

function formatStateSuffix(annotation: ComboIngredientAnnotation): string {
  const parts: string[] = [];
  if (annotation.cardState) {
    const zone = annotation.stateZone ? ` (${comboZoneLabel(annotation.stateZone)})` : "";
    parts.push(`required state${zone}: ${annotation.cardState}`);
  }
  parts.push(`must be commander: ${annotation.mustBeCommander ? "yes" : "no"}`);
  return parts.join("; ");
}

function formatAnnotation(annotation: ComboIngredientAnnotation): string {
  const permitted = formatZoneList(annotation.permittedZones.map(comboZoneLabel));
  const quantity = annotation.quantityRequired > 1 ? ` x${annotation.quantityRequired}` : "";
  const label = `${annotation.label}${quantity}`;
  const state = formatStateSuffix(annotation);

  switch (annotation.kind) {
    case "compatible-present": {
      const where = annotation.occupiedZones.length > 0 ? formatZoneList(annotation.occupiedZones.map(comboZoneLabel)) : permitted;
      return `- ${label} — present in a compatible zone (${where}); ${state}`;
    }
    case "matched-template": {
      const where = annotation.occupiedZones.length > 0 ? formatZoneList(annotation.occupiedZones.map(comboZoneLabel)) : permitted;
      return `- ${label} [template] — satisfied by a submitted card in a compatible zone (${where}); ${state}`;
    }
    case "wrong-zone": {
      const observed = formatZoneList(annotation.wrongZones);
      const shortfall = annotation.quantityRequired - annotation.quantitySatisfied;
      return `- ${label} — INCORRECTLY ZONED: submitted in ${observed}, but this combo needs it in ${permitted} (${shortfall} still unsatisfied); ${state}`;
    }
    case "missing-exact": {
      const shortfall = annotation.quantityRequired - annotation.quantitySatisfied;
      return `- ${label} — MISSING (${shortfall} needed); expected zone: ${permitted}; ${state}`;
    }
    case "unresolved-template":
      return `- ${label} [template] — UNRESOLVED: the catalog has no authoritative card list for this requirement, so it cannot be matched automatically; expected zone: ${permitted}; ${state}`;
  }
}

function formatCandidate(candidate: ComboCandidate, position: number): string {
  const { variant } = candidate;
  const classification = candidate.fullyAssigned ? FULLY_ASSIGNED_CLASSIFICATION : PARTIAL_CLASSIFICATION;

  const lines = [`${position}. ${classification} — ${variant.sourceUrl}`];

  if (variant.producedEffects.length > 0) {
    lines.push(`   produces: ${variant.producedEffects.join("; ")}`);
  }

  lines.push("   ingredients:");
  for (const annotation of candidate.annotations) {
    lines.push(`   ${formatAnnotation(annotation)}`);
  }

  if (variant.manaNeeded.length > 0) lines.push(`   mana needed: ${variant.manaNeeded}`);
  if (variant.easyPrerequisites.length > 0) lines.push(`   easy prerequisites: ${variant.easyPrerequisites}`);
  if (variant.notablePrerequisites.length > 0) lines.push(`   notable prerequisites: ${variant.notablePrerequisites}`);

  if (variant.steps.length > 0) {
    lines.push("   steps:");
    for (const step of variant.steps.split("\n")) {
      if (step.trim().length > 0) lines.push(`   ${step.trim()}`);
    }
  }

  if (variant.notes.length > 0) lines.push(`   notes: ${variant.notes}`);

  return lines.join("\n");
}

/**
 * Render the selected candidates. No candidates produces an empty string — and
 * therefore no heading — rather than an empty section.
 */
export function formatComboSection(candidates: ComboCandidate[]): string {
  if (candidates.length === 0) return "";

  return [
    COMBO_SECTION_HEADING,
    ...COMBO_INSTRUCTION_LINES,
    "",
    candidates.map((candidate, index) => formatCandidate(candidate, index + 1)).join("\n\n")
  ].join("\n");
}
