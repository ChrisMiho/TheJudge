import { useEffect, useRef, useState } from "react";
import { formatElapsed } from "../lib/askAiWaitStages";
import { useElapsedWaitTimer } from "../hooks/useElapsedWaitTimer";

type AskAiWaitingPanelProps = {
  isSubmitting: boolean;
};

export function AskAiWaitingPanel({ isSubmitting }: AskAiWaitingPanelProps): JSX.Element {
  const { elapsed, stage } = useElapsedWaitTimer(isSubmitting);

  // REQ-023: "the line before lifts and fades" when the threshold advances — the
  // outgoing line keeps rendering, under a lift-away animation, until it is
  // unmounted; the new line renders immediately with the ink-in treatment. Both
  // are plain CSS keyframes (NFR-006, `clip-path`/`opacity`/`transform` only — no
  // layout-affecting property, no script-driven animation loop). The timeout below
  // only decides *when* to unmount the outgoing element — matched to the lift-away
  // keyframe's own duration (`--motion-slow`, 280ms) — rather than listening for
  // `animationend`: jsdom has no `AnimationEvent` global and never fires it, which
  // would make this unmount untestable and, in a slow/throttled real browser tab,
  // `animationend` can also simply not fire. A fixed timeout is exactly as correct
  // here (REQ-023 never promises the lift lingers past its own animation) and is
  // deterministic either way.
  const LIFT_AWAY_DURATION_MS = 280;
  const [liftingMessage, setLiftingMessage] = useState<string | null>(null);
  const previousMessageRef = useRef(stage.message);
  const [inkKey, setInkKey] = useState(0);

  useEffect(() => {
    if (previousMessageRef.current === stage.message) return;
    setLiftingMessage(previousMessageRef.current);
    previousMessageRef.current = stage.message;
    setInkKey((current) => current + 1);

    const timeoutId = setTimeout(() => setLiftingMessage(null), LIFT_AWAY_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [stage.message]);

  return (
    <div
      className={`wait-inscription-bubble ambient-accent-surface ambient-accent-interactive wait-stage-${stage.variant}`}
      data-accent-current="true"
    >
      {/* The colour's seal: a small ringed badge the message sits under. Only the
          ring turns (transform: rotate); the seal face itself does not move. Two
          motes of the colour's light drift up beside it (transform/opacity). */}
      <div aria-hidden="true" className="wait-inscription-seal">
        <span className="wait-inscription-seal-ring" />
        <span className="wait-inscription-mote wait-inscription-mote-a" />
        <span className="wait-inscription-mote wait-inscription-mote-b" />
      </div>

      <div className="wait-inscription-message-stack">
        {liftingMessage && (
          <p
            aria-hidden="true"
            className="wait-inscription-line wait-inscription-line-lift"
          >
            {liftingMessage}
          </p>
        )}
        <p
          key={inkKey}
          aria-live="polite"
          aria-atomic="true"
          className={`wait-inscription-line wait-inscription-line-ink${
            stage.variant === "absurd" ? " italic" : ""
          }`}
        >
          {stage.message}
        </p>
      </div>

      {/* The elapsed clock ticks at the bubble's foot (REQ-023). */}
      <p className="wait-inscription-clock">{formatElapsed(elapsed)}</p>
    </div>
  );
}
