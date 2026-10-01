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
      testId={testId}
      head={
        <h2 id={titleId} className="text-lg font-black text-zinc-100">
          {question}
        </h2>
      }
      foot={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onKeep}
            className="motion-press motion-focus min-h-[2.75rem] rounded-2xl border border-zinc-700 bg-zinc-900 px-4 font-bold text-zinc-200 hover:bg-zinc-800"
          >
            {keepLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="motion-press motion-focus min-h-[2.75rem] rounded-2xl bg-accent-strong px-4 font-bold text-accent-contrast"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-zinc-300">{detail}</p>
    </SheetShell>
  );
}
