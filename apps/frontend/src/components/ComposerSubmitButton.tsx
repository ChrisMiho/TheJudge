/**
 * Consistent with the corner rail's inline stroke-SVG icon convention (DEC-126).
 * Shared so the answered-view follow-up composer and the two pre-submit composers
 * carry one definition rather than three copies.
 */
export function SendIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

type ComposerSubmitButtonProps = {
  /** Accessible name, kept identical at every width (REQ-121). */
  label: string;
  /**
   * On-screen text, if it should differ from the accessible name. Defaults to
   * `label` when omitted. Lets the initial pre-submit composers show "Send
   * Request" (DEC-153) while `aria-label` keeps a distinct Ask/Decrypt name.
   */
  visibleLabel?: string;
  /** Visible label while the request is in flight; the accessible name does not change. */
  pendingLabel: string;
  isSubmitting: boolean;
  disabled: boolean;
  /**
   * When true, the visible label renders at every width instead of being
   * hidden below `sm` and swapped for an icon-only circle (DEC-153). Used only
   * by the two initial pre-submit composers (Enrichment decrypt, Quick
   * Question ask) — the answered-view follow-up composer does not use this
   * component and stays icon-only regardless.
   */
  showLabelBelowSm?: boolean;
};

/**
 * Submit control for the pre-submit question composers (DEC-146, REQ-121).
 *
 * By default, below `sm` it renders icon-only in a 44px circle, matching
 * `FollowUpComposer`'s treatment, so the field keeps the dominant share of a
 * phone-width row instead of being starved to 40% by a wide labelled button.
 * At `sm` and up the label returns, where the row has width to spare.
 * `aria-label` carries the same name at both widths, so assistive technology
 * never sees the control change identity.
 *
 * When `showLabelBelowSm` is set (DEC-153), the visible label renders at
 * every width instead — used only by the two initial-submit call sites so
 * their "Send Request" label is never icon-only.
 */
export function ComposerSubmitButton({
  label,
  visibleLabel,
  pendingLabel,
  isSubmitting,
  disabled,
  showLabelBelowSm = false
}: ComposerSubmitButtonProps): JSX.Element {
  const text = visibleLabel ?? label;

  if (showLabelBelowSm) {
    return (
      <button
        type="submit"
        aria-label={label}
        disabled={disabled}
        className="flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-accent to-accent-strong px-2 text-xs font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:min-h-[2.75rem] sm:px-4 sm:py-2 sm:text-sm"
      >
        {isSubmitting ? pendingLabel : text}
      </button>
    );
  }

  return (
    <button
      type="submit"
      aria-label={label}
      disabled={disabled}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-strong text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:w-auto sm:min-h-[2.75rem] sm:px-4 sm:py-2"
    >
      <span className="sm:hidden">
        {isSubmitting ? <span className="send-spinner" /> : <SendIcon />}
      </span>
      <span className="hidden sm:inline">{isSubmitting ? pendingLabel : text}</span>
    </button>
  );
}
