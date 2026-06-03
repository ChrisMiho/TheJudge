export type FlowStepId = "game-setup" | "zone-confirm" | "zone-collection" | "enrichment";

export const FLOW_STEPS: FlowStepId[] = [
  "game-setup",
  "zone-confirm",
  "zone-collection",
  "enrichment"
];

export const FLOW_STEP_LABELS: Record<FlowStepId, string> = {
  "game-setup": "Game Setup",
  "zone-confirm": "Confirm Zones",
  "zone-collection": "Add Cards",
  enrichment: "Enrich & Submit"
};

export function getNextStep(current: FlowStepId): FlowStepId | null {
  const index = FLOW_STEPS.indexOf(current);
  return index >= 0 && index < FLOW_STEPS.length - 1 ? FLOW_STEPS[index + 1]! : null;
}

export function getPreviousStep(current: FlowStepId): FlowStepId | null {
  const index = FLOW_STEPS.indexOf(current);
  return index > 0 ? FLOW_STEPS[index - 1]! : null;
}
