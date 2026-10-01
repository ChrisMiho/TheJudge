import type { Ref } from "react";
import { DictationMicButton } from "./DictationMicButton";
import { useDictation } from "../hooks/useDictation";
import { SendIcon } from "./ComposerSubmitButton";

const RING_RADIUS = 19;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
/** REQ-206: the ring brightens over the last 30 of the 300-character budget. */
const RING_BRIGHT_THRESHOLD = 30;

export interface ComposerPillProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  placeholder: string;
  textareaAriaLabel: string;
  /** Accessible name for the send control, e.g. "Ask TheJudge" (unchanged across submit states). */
  submitLabel: string;
  /** Visible-only text while the request is in flight (accessible name is unchanged). */
  pendingLabel: string;
  isSubmitting?: boolean;
  /** Blocks submit only (e.g. an empty box) — the player can still type. The textarea
   * itself disables only while `isSubmitting`. */
  disabled?: boolean;
  /** Omit entirely to hide the "Add in-depth details" segment (REQ-206: this page's own composer only). */
  onAddInDepthDetails?: () => void;
  addInDepthDetailsDisabled?: boolean;
  addInDepthDetailsLabel?: string;
  textareaId?: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
}

/**
 * REQ-206, REQ-132, REQ-012, REQ-121: the suite's one-pill question box — the Add
 * in-depth details pill at its left end, the text, the character count, and the round
 * send control, with a 300-character ring traced round the send pill's edge. There is
 * no separate labelled submit button and no visible "Send Request" text; the send
 * control's accessible name carries the existing Ask/Decrypt semantics with no visible
 * label (REQ-132 as amended).
 */
export function ComposerPill({
  value,
  onChange,
  onSubmit,
  maxLength,
  placeholder,
  textareaAriaLabel,
  submitLabel,
  pendingLabel,
  isSubmitting = false,
  disabled = false,
  onAddInDepthDetails,
  addInDepthDetailsDisabled = false,
  addInDepthDetailsLabel = "Add in-depth details",
  textareaId,
  textareaRef
}: ComposerPillProps): JSX.Element {
  const length = value.length;
  const progress = maxLength > 0 ? Math.min(length / maxLength, 1) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isBright = maxLength - length <= RING_BRIGHT_THRESHOLD;
  const submitDisabled = disabled || isSubmitting;

  const dictation = useDictation({ value, onChange, maxLength });

  function handleSubmit(): void {
    if (dictation.isListening) dictation.stop();
    onSubmit();
  }

  return (
    <div
      className="ambient-accent-surface ambient-accent-interactive flex items-end gap-1 rounded-3xl border border-zinc-700/70 bg-zinc-900/55 py-2 pl-2 pr-1 sm:gap-2 sm:pl-3 sm:pr-2"
      data-testid="composer-pill"
    >
      {onAddInDepthDetails && (
        <button
          type="button"
          onClick={onAddInDepthDetails}
          disabled={addInDepthDetailsDisabled}
          aria-label={addInDepthDetailsLabel}
          data-testid="composer-pill-in-depth"
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-accent/60 bg-accent/10 px-2.5 text-accent-soft transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50 xs:px-3"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
          >
            <rect x="3" y="4" width="14" height="18" rx="2" />
            <path d="M17 9h4" />
            <path d="M19 7v4" />
          </svg>
          {/* The label text hides below 480px (REQ-206: "glyph only below 480px"); the
              accessible name above always carries the full text regardless of width. */}
          <span aria-hidden="true" className="hidden whitespace-nowrap text-xs font-semibold xs:inline">
            In-depth details
          </span>
        </button>
      )}

      <textarea
        ref={textareaRef}
        id={textareaId}
        aria-label={textareaAriaLabel}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!submitDisabled) handleSubmit();
          }
        }}
        rows={1}
        placeholder={dictation.isListening ? "Listening…" : placeholder}
        disabled={isSubmitting}
        className="min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm normal-case tracking-normal text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
      />

      <div className="flex shrink-0 flex-col items-center gap-0.5">
        {length > 0 && (
          <span
            data-testid="composer-pill-count"
            className="pr-0.5 text-[10px] leading-none text-zinc-400 sm:text-xs"
          >
            {length}/{maxLength}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {/* REQ-212: the mic half exists only where the browser exposes speech
              recognition; where it does not, the pill is the arrow alone, unchanged. */}
          {dictation.isSupported && (
            <DictationMicButton isListening={dictation.isListening} onToggle={dictation.toggle} />
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            aria-label={isSubmitting ? pendingLabel : submitLabel}
            data-testid="composer-pill-send"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-strong text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {length > 0 && (
              <svg
                viewBox="0 0 44 44"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
              >
                <circle
                  cx="22"
                  cy="22"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={isBright ? "text-accent-soft" : "text-accent-soft/40"}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
            )}
            {isSubmitting ? <span className="send-spinner" /> : <SendIcon />}
          </button>
        </div>
        {dictation.error && (
          <p role="alert" data-testid="composer-pill-dictation-error" className="text-[10px] leading-tight text-rose-400">
            {dictation.error}
          </p>
        )}
      </div>
    </div>
  );
}
