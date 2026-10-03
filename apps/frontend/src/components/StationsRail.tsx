import { FLOW_STEPS, type FlowStepId } from "../lib/contextFlow";

const STATION_LABELS: Record<FlowStepId, string> = {
  "game-context": "Game",
  "zone-confirm": "Zones",
  "zone-collection": "Cards",
  enrichment: "Context"
};

export type StationsRailProps = {
  /** The station currently shown. */
  currentStep: FlowStepId;
  /** The furthest station index this walk has reached — a station is tappable up to and
   * including this index (REQ-209: "stations are tappable"); one beyond it is not yet
   * reachable and renders disabled rather than silently doing nothing on tap. */
  furthestStepIndex: number;
  onNavigate: (step: FlowStepId) => void;
};

/**
 * REQ-209: In-depth details' four stations — Game · Zones · Cards · Context — on one
 * tappable progress rail, replacing a text-only step name with real navigation. A station
 * already reached (including the current one) is always tappable to go back to; the
 * guardrail that bounces Context back to Cards while a carried card is unplaced lives in
 * the caller's `onNavigate` (`MtgAssistantApp`'s `handleRailNavigate`), not here — this
 * component only renders the rail and reports taps.
 */
export function StationsRail({ currentStep, furthestStepIndex, onNavigate }: StationsRailProps): JSX.Element {
  const currentIndex = FLOW_STEPS.indexOf(currentStep);
  // The mockup's lit path runs between the first and last node centres, i.e. 75% of the rail.
  const fillPercent = FLOW_STEPS.length > 1 ? (currentIndex / (FLOW_STEPS.length - 1)) * 75 : 0;

  return (
    <nav className="rail" aria-label="In-depth details steps">
      <span className="fill" aria-hidden="true" style={{ width: `${fillPercent}%` }} />
      {FLOW_STEPS.map((step, index) => {
        const isCurrent = step === currentStep;
        const isReachable = index <= furthestStepIndex;
        return (
          <button
            key={step}
            type="button"
            className="motion-focus"
            aria-label={`Station ${index + 1}: ${STATION_LABELS[step]}`}
            aria-current={isCurrent ? "step" : undefined}
            data-done={index < currentIndex}
            disabled={!isReachable}
            onClick={() => onNavigate(step)}
          >
            <span className="node" aria-hidden="true">
              {index + 1}
            </span>
            {STATION_LABELS[step]}
          </button>
        );
      })}
    </nav>
  );
}
