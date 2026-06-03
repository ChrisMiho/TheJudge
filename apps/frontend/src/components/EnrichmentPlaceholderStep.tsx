import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { ZoneCardItem, ZoneId } from "../types";

type EnrichmentPlaceholderStepProps = {
  selectedZones: ZoneId[];
  zones: Partial<Record<ZoneId, ZoneCardItem[]>>;
  onBack: () => void;
  onContinue: () => void;
  statusMessage: string | null;
};

export function EnrichmentPlaceholderStep({
  selectedZones,
  zones,
  onBack,
  onContinue,
  statusMessage
}: EnrichmentPlaceholderStepProps): JSX.Element {
  const zoneSummaries = CANONICAL_ZONE_ORDER.filter((zone) => selectedZones.includes(zone)).map((zone) => ({
    zone,
    count: zones[zone]?.length ?? 0
  }));
  const totalCards = zoneSummaries.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 md:p-6">
        <header>
          <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            TheJudge
          </h1>
          <p className="text-sm text-slate-300">Stack Assistant</p>
        </header>

        <h2 className="text-2xl font-semibold text-sky-300">Context enrichment</h2>
        <p className="text-sm text-slate-400">
          Review your zone card counts before enriching caster, targets, and notes for each card.
        </p>

        <div className="space-y-2 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
            {`Total cards: ${totalCards}`}
          </p>
          {zoneSummaries.length === 0 ? (
            <p className="text-sm text-slate-300">No zones selected.</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-300">
              {zoneSummaries.map(({ zone, count }) => (
                <li key={zone}>{`${ZONE_LABELS[zone]}: ${count}`}</li>
              ))}
            </ul>
          )}
        </div>

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
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Continue to enrichment
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
