function MicIcon(): JSX.Element {
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
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export interface DictationMicButtonProps {
  isListening: boolean;
  onToggle: () => void;
  /** Defaults to 44px (REQ-205's touch floor), matching the send control beside it. */
  sizeClassName?: string;
  /**
   * "standalone" (default): its own rounded border/background, used wherever the mic
   * sits on its own (`EnrichmentStep`). "flat" (look-matching pass, slice M): no border
   * or background of its own — for use inside `.send-pair`
   * (`ComposerPill`/`FollowUpComposer`), which supplies the pill's own surface, the
   * mic/send divider, and the `[aria-pressed="true"]` glow (`flow.css:224-239`).
   */
  variant?: "standalone" | "flat";
}

/**
 * REQ-212: the mic half of a question box's send pill — rendered only where the caller
 * has already confirmed the browser exposes speech recognition (`useDictation`'s
 * `isSupported`). Shared across every question box so the glyph, glow and accessible
 * names ("Dictate question" / "Stop dictating") are defined exactly once.
 */
export function DictationMicButton({
  isListening,
  onToggle,
  sizeClassName = "h-11 w-11",
  variant = "standalone"
}: DictationMicButtonProps): JSX.Element {
  const variantClassName =
    variant === "flat"
      ? "send-pair-mic text-current"
      : `rounded-full border ${
          isListening
            ? "border-accent-soft bg-accent-soft/20 text-accent-soft"
            : "border-zinc-700/70 bg-zinc-800/60 text-accent-soft hover:bg-zinc-700/60"
        }`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isListening ? "Stop dictating" : "Dictate question"}
      aria-pressed={isListening}
      data-testid="dictation-mic"
      className={`flex shrink-0 items-center justify-center transition ${sizeClassName} ${variantClassName}`}
    >
      <MicIcon />
    </button>
  );
}
