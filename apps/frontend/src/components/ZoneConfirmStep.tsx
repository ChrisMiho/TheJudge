import type { ReactNode } from "react";
import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { ZoneId } from "../types";
import type { ConversationHistoryTriggerDescriptor } from "./ConversationWorkspace";
import { PageShell } from "./PageShell";
import { StagedStepHeader } from "./StagedStepHeader";

type ZoneConfirmStepProps = {
  selectedZones: ZoneId[];
  canContinue: boolean;
  onZoneToggle: (zone: ZoneId) => void;
  /** Look-matching pass (slice N), requirement 3: the per-step "Back" button is
   * retired — the shared header's ‹ (rendered by the caller, above `stationsRail`)
   * is the only way back now. Kept in the prop contract so the caller's wiring is
   * unchanged; this component simply no longer renders a control that calls it. */
  onBack: () => void;
  onContinue: () => void;
  statusMessage: string | null;
  historyTrigger?: ConversationHistoryTriggerDescriptor;
  /** REQ-209: the four-station progress rail, rendered between the header and the step
   * name. Owned by the caller (`MtgAssistantApp`). */
  stationsRail?: ReactNode;
};

export function ZoneConfirmStep({
  selectedZones,
  canContinue,
  onZoneToggle,
  onContinue,
  statusMessage,
  historyTrigger,
  stationsRail
}: ZoneConfirmStepProps): JSX.Element {
  return (
    <PageShell>
        <StagedStepHeader historyTrigger={historyTrigger} />
        {stationsRail}
        {/* Look-matching pass (slice N), requirement 3: one `.plate` holding the zone
            grid, with `.plate-next` as its own way forward (`in-depth-question.html:486-493`). */}
        <div className="plate">
          <h2>Zone confirmation</h2>
          <p className="lede">Select all zones that apply to your question.</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CANONICAL_ZONE_ORDER.map((zone) => {
              const checked = selectedZones.includes(zone);
              return (
                <label
                  key={zone}
                  data-accent-current={checked}
                  data-checked={checked}
                  className="zone-tile ambient-accent-surface ambient-accent-interactive motion-hover motion-press"
                >
                  <input
                    type="checkbox"
                    aria-label={`Zone: ${ZONE_LABELS[zone]}`}
                    checked={checked}
                    onChange={() => onZoneToggle(zone)}
                    className="motion-focus sr-only"
                  />
                  <span className="mark" aria-hidden="true">
                    {checked ? "✓" : ""}
                  </span>
                  <span className="font-medium text-zinc-100">{ZONE_LABELS[zone]}</span>
                </label>
              );
            })}
          </div>

          {!canContinue && (
            <p className="mt-2 text-xs text-amber-300/90">Select at least one zone to continue.</p>
          )}

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="plate-next motion-hover motion-press motion-focus"
          >
            <span>
              Continue
              <small aria-hidden="true">next: the cards in each zone</small>
            </span>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </button>
        </div>

        {statusMessage && (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
            {statusMessage}
          </p>
        )}
    </PageShell>
  );
}
