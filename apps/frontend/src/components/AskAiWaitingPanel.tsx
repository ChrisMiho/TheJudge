import { formatElapsed } from "../lib/askAiWaitStages";
import { useElapsedWaitTimer } from "../hooks/useElapsedWaitTimer";

type AskAiWaitingPanelProps = {
  isSubmitting: boolean;
};

export function AskAiWaitingPanel({ isSubmitting }: AskAiWaitingPanelProps): JSX.Element {
  const { elapsed, stage } = useElapsedWaitTimer(isSubmitting);

  return (
    <div className={`rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4 space-y-2 wait-stage-${stage.variant}`}>
      <p className="text-2xl font-mono text-zinc-100">{formatElapsed(elapsed)}</p>
      <p aria-live="polite" aria-atomic="true" className="text-sm text-zinc-300">
        {stage.message}
      </p>
    </div>
  );
}
