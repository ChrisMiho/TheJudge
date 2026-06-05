import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { ZoneId } from "../types";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 md:p-6">
        <header>
          <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            TheJudge
          </h1>
          <p className="text-sm text-slate-300">Stack Assistant</p>
        </header>

        <h2 className="text-2xl font-semibold text-sky-300">Zone confirmation</h2>
        <p className="text-sm text-slate-400">Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.</p>

        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 sm:grid-cols-2">
          {CANONICAL_ZONE_ORDER.map((zone) => {
            const checked = selectedZones.includes(zone);
            return (
              <label
                key={zone}
                className="flex min-h-[2.75rem] cursor-pointer items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-2.5 text-sm transition hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  aria-label={`Zone: ${ZONE_LABELS[zone]}`}
                  checked={checked}
                  onChange={() => onZoneToggle(zone)}
                  className="h-4 w-4 shrink-0 rounded border-slate-500 accent-cyan-400"
                />
                <span className="font-medium text-slate-100">{ZONE_LABELS[zone]}</span>
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
            className="rounded-xl border border-slate-500 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700/80"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>

        {statusMessage && (
          <p className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-200">
            {statusMessage}
          </p>
        )}
      </section>
    </main>
  );
}
