import type { Ref } from "react";
import { DictationMicButton } from "./DictationMicButton";
import { useDictation } from "../hooks/useDictation";
import { SendIcon } from "./ComposerSubmitButton";

/**
 * `flow.css:69` — the capsule-shaped ring traced round the send pill, drawn with
 * `pathLength={100}` so a percentage of the 300-character budget maps directly to
 * `strokeDasharray`. Scaled from the mockup's 80×40 pill to this suite's 88×44
 * (REQ-205's 44px touch floor — see `.send-pair` in `index.css`): inset 4px, each half
 * 44px tall, so the capsule's straight run spans x=26..70 at y=4/48 with a 22px radius.
 */
const SEND_RING_PATH = "M26 4 H70 A22 22 0 0 1 70 48 H26 A22 22 0 0 1 26 4 Z";
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
 *
 * Look-matching pass (slice M): restyled to `flow.css:187-274`'s `.composer`/`.q-box`/
 * `.deep`/`.send-pair`/`.send-wrap`/`.send-ring` — a split mic/send pill in place of two
 * separate round buttons, with the 300-character budget drawn as a capsule ring round
 * the pill's own edge instead of a circle round the send button alone.
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
  const isBright = maxLength - length <= RING_BRIGHT_THRESHOLD;
  const submitDisabled = disabled || isSubmitting;

  const dictation = useDictation({ value, onChange, maxLength });

  function handleSubmit(): void {
    if (dictation.isListening) dictation.stop();
    onSubmit();
  }

  return (
    <div className="q-box" data-testid="composer-pill">
      {onAddInDepthDetails && (
        <button
          type="button"
          onClick={onAddInDepthDetails}
          disabled={addInDepthDetailsDisabled}
          aria-label={addInDepthDetailsLabel}
          data-testid="composer-pill-in-depth"
          className="deep motion-focus"
        >
          <span className="glyph" aria-hidden="true">
            ◈
          </span>
          {/* The label text hides below 480px (REQ-206: "glyph only below 480px"); the
                accessible name above always carries the full text regardless of width. */}
          <span aria-hidden="true" className="hidden whitespace-nowrap xs:inline">
            In-depth
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
      />

      {length > 0 && (
        <span data-testid="composer-pill-count" className="q-count">
          {length}/{maxLength}
        </span>
      )}

      <span className="send-wrap">
        {length > 0 && (
          <svg className="send-ring" data-testid="composer-pill-ring" viewBox="0 0 96 52" aria-hidden="true">
            <path className="track" d={SEND_RING_PATH} pathLength={100} />
            <path
              className={isBright ? "fill bright" : "fill"}
              d={SEND_RING_PATH}
              pathLength={100}
              strokeDasharray={`${progress * 100} 100`}
            />
          </svg>
        )}
        <span className="send-pair">
          {/* REQ-212: the mic half exists only where the browser exposes speech
                recognition; where it does not, the pill is the arrow alone, unchanged. */}
          {dictation.isSupported && (
            <DictationMicButton
              isListening={dictation.isListening}
              onToggle={dictation.toggle}
              variant="flat"
              sizeClassName="h-11 w-11"
            />
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            aria-label={isSubmitting ? pendingLabel : submitLabel}
            data-testid="composer-pill-send"
            className="h-11 w-11"
          >
            {isSubmitting ? <span className="send-spinner" /> : <SendIcon />}
          </button>
        </span>
      </span>
      {dictation.error && (
        <p role="alert" data-testid="composer-pill-dictation-error" className="text-[10px] leading-tight text-rose-400">
          {dictation.error}
        </p>
      )}
    </div>
  );
}
