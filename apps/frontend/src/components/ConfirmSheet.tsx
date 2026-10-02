import { useId } from "react";
import { SheetShell } from "./SheetShell";

export interface ConfirmSheetProps {
  isOpen: boolean;
  /** The "keep" path: dismiss without taking the destructive action. */
  onKeep: () => void;
  /** The "clear" path: take the destructive action, then close. */
  onConfirm: () => void;
  /** A plain yes/no question, e.g. "Start a new trade?". */
  question: string;
  /** One line naming what the destructive action clears, e.g. "This clears both piles." */
  detail: string;
  keepLabel?: string;
  /** The destructive action's own label, e.g. "New trade", "Reset life totals". */
  confirmLabel: string;
  testId?: string;
}

/**
 * The suite's one shared "are you sure?" (REQ-208), built on `SheetShell`. Used before a
 * destructive action — Trade Balancer's New trade (slice G), Life Tracker's Reset life
 * totals / New game (slice J). Callers never render this sheet when there is nothing to
 * clear: `isOpen` is the caller's own "is there anything to lose" guard, not a prop this
 * component evaluates itself.
 *
 * Look-matching pass (slice L): takes `SheetShell`'s new glass shell with no
 * markup change of its own (slice J already matched this sheet's words and
 * its Keep/Reset buttons to the mockup; only the shared surface moved).
 */
export function ConfirmSheet({
  isOpen,
  onKeep,
  onConfirm,
  question,
  detail,
  keepLabel = "Keep",
  confirmLabel,
  testId = "confirm-sheet"
}: ConfirmSheetProps): JSX.Element | null {
  const titleId = useId();

  return (
    <SheetShell
      isOpen={isOpen}
      onClose={onKeep}
      closeLabel={`Keep — don't ${confirmLabel.toLowerCase()}`}
      titleId={titleId}
      panelClassName="confirm-panel"
      showCloseButton={false}
      testId={testId}
    >
      <h2 id={titleId}>{question}</h2>
      <p>{detail}</p>
      <div className="row">
        <button type="button" className="btn" onClick={onKeep}>
          {keepLabel}
        </button>
        <button type="button" className="btn go" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </SheetShell>
  );
}
