import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { ZoneId } from "../types";
import { PageShell } from "./PageShell";
import { StagedStepHeader } from "./StagedStepHeader";

type ZoneConfirmStepProps = {
  selectedZones: ZoneId[];
  canContinue: boolean;
  onZoneToggle: (zone: ZoneId) => void;
  onBack: () => void;
  onContinue: () => void;
  statusMessage: string | null;
};

export function ZoneConfirmStep({
  selectedZones,
  canContinue,
  onZoneToggle,
  onBack,
  onContinue,
  statusMessage
}: ZoneConfirmStepProps): JSX.Element {
  return (
    <PageShell>
        <StagedStepHeader stepName="Zone confirmation" />
        <p className="text-sm text-zinc-400">Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.</p>

        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4 sm:grid-cols-2">
          {CANONICAL_ZONE_ORDER.map((zone) => {
            const checked = selectedZones.includes(zone);
            return (
              <label
                key={zone}
                className="flex min-h-[2.75rem] cursor-pointer items-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2.5 text-sm transition hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  aria-label={`Zone: ${ZONE_LABELS[zone]}`}
                  checked={checked}
                  onChange={() => onZoneToggle(zone)}
                  className="h-4 w-4 shrink-0 rounded border-zinc-500 accent-accent"
                />
                <span className="font-medium text-zinc-100">{ZONE_LABELS[zone]}</span>
              </label>
            );
          })}
        </div>

        {!canContinue && (
          <p className="text-xs text-amber-300/90">Select at least one zone to continue.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-zinc-500 bg-zinc-800/70 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
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
