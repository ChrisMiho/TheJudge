export type FlowStepId = "game-context" | "zone-confirm" | "zone-collection" | "enrichment";

export const FLOW_STEPS: FlowStepId[] = [
  "game-context",
  "zone-confirm",
  "zone-collection",
  "enrichment"
];

export function getNextStep(current: FlowStepId): FlowStepId | null {
  const index = FLOW_STEPS.indexOf(current);
  return index >= 0 && index < FLOW_STEPS.length - 1 ? FLOW_STEPS[index + 1]! : null;
}

export function getPreviousStep(current: FlowStepId): FlowStepId | null {
  const index = FLOW_STEPS.indexOf(current);
  return index > 0 ? FLOW_STEPS[index - 1]! : null;
}
