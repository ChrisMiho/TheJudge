import { useEffect, useLayoutEffect, useRef, type Ref } from "react";
import { DictationMicButton } from "./DictationMicButton";
import { useDictation } from "../hooks/useDictation";
import { budgetFillStyle } from "../lib/theme/flowStyles";

/** The stadium path round the send pill, begun at the top of the mic|send seam and run clockwise
 * (the mockup's `flow.js` RING_PATH): the fill grows out of the seam. */
const SEND_RING_PATH = "M44 4 H64 A20 20 0 0 1 64 44 H24 A20 20 0 0 1 24 4 Z";
/** Within this many characters of the cap the ring and the count turn bright (the mockup's `near`). */
const NEAR_CAP_CHARACTERS = 30;
/** A textarea taller than this many pixels has crossed the one-line threshold (the mockup's `autoGrow`). */
const ONE_LINE_THRESHOLD_PX = 56;

export interface ComposerPillProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  /** The hint shown in the empty box. */
  placeholder: string;
  /**
   * The hint in tiers, longest first (the mockup's `data-placeholders`): as the box narrows the
   * longest tier that fits on one line is shown. Omit for a single fixed hint.
   */
  placeholders?: readonly string[];
  textareaAriaLabel: string;
  submitLabel: string;
  pendingLabel: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  /** When present, renders the in-depth chip at the box's bottom-left; click carries the cards and the question. */
  onAddInDepthDetails?: () => void;
  addInDepthDetailsDisabled?: boolean;
  addInDepthDetailsLabel?: string;
  textareaId?: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
  /** "question" (default): the pre-submit box. "followup": the answered view's box (`.followup`: the text, the count and the mic|send pill, no In-depth chip). */
  variant?: "question" | "followup";
  surfaceClassName?: string;
  accentCurrent?: boolean;
}

/**
 * FLOW-011 / REQ-206: Ask a Question's question box in the mockup's own markup, so the ported
 * `flow.css` shapes it: the In-depth chip, the text, and the mic|send pill (no numeric count; the ring is the budget cue) with
 * the budget ring round it. Its shape follows the text: one line shares a row with the chip and the
 * send; from a second line (or a hint that wraps) the text takes the top row and the chip (left) and
 * the mic|send pill (right) step down onto the row beneath (`flow.css` `:has(textarea.grown)`). The
 * budget ring is drawn by CSS from the box's `--fill` and `data-near`. The Enter-to-send, 300-character
 * cap and dictation (REQ-212) behaviours are unchanged.
 */
export function ComposerPill({
  value,
  onChange,
  onSubmit,
  maxLength,
  placeholder,
  placeholders,
  textareaAriaLabel,
  submitLabel,
  pendingLabel,
  isSubmitting = false,
  disabled = false,
  onAddInDepthDetails,
  addInDepthDetailsDisabled = false,
  addInDepthDetailsLabel = "Add in-depth details",
  textareaId,
  textareaRef,
  variant = "question",
  surfaceClassName,
  accentCurrent
}: ComposerPillProps): JSX.Element {
  const length = value.length;
  const isNear = maxLength - length <= NEAR_CAP_CHARACTERS && length > 0;
  const submitDisabled = disabled || isSubmitting;

  const dictation = useDictation({ value, onChange, maxLength });
  const boxRef = useRef<HTMLDivElement>(null);
  const ownTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  function setTextarea(node: HTMLTextAreaElement | null): void {
    ownTextareaRef.current = node;
    if (typeof textareaRef === "function") textareaRef(node);
    else if (textareaRef) (textareaRef as { current: HTMLTextAreaElement | null }).current = node;
  }

  // The two shapes: measured on the textarea itself, the way the mockup's `autoGrow` does — drop the
  // `grown` shape, size to content, and take it back when the text no longer fits one line. The
  // textarea's own height stays with `useAutoGrowTextarea` in the caller.
  useLayoutEffect(() => {
    const textarea = ownTextareaRef.current;
    const box = boxRef.current;
    if (!textarea || !box) return;
    const previous = textarea.style.height;
    textarea.classList.remove("grown");
    textarea.style.height = "auto";
    const grown = textarea.scrollHeight > ONE_LINE_THRESHOLD_PX;
    textarea.classList.toggle("grown", grown);
    textarea.style.height = previous;
    box.style.borderRadius = grown ? "1.1rem" : "";
  }, [value, dictation.isListening]);

  // The hint comes in tiers (the mockup's `fitPlaceholder`): the longest that fits the box on one line
  // is shown, re-measured whenever the box changes width. Idle while listening ("Listening…").
  useEffect(() => {
    const textarea = ownTextareaRef.current;
    if (!textarea || !placeholders || placeholders.length < 2 || dictation.isListening) return;
    const context = document.createElement("canvas").getContext?.("2d");
    if (!context) return;
    const fit = (): void => {
      const styles = getComputedStyle(textarea);
      context.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      const room =
        textarea.clientWidth - (parseFloat(styles.paddingLeft) || 0) - (parseFloat(styles.paddingRight) || 0) - 2;
      const pick = placeholders.find((tier) => context.measureText(tier).width <= room) ?? placeholders[placeholders.length - 1]!;
      if (textarea.placeholder !== pick) textarea.placeholder = pick;
    };
    fit();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }
    const observer = new ResizeObserver(fit);
    observer.observe(textarea);
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [placeholders, dictation.isListening]);

  function handleSubmit(): void {
    if (dictation.isListening) dictation.stop();
    onSubmit();
  }

  return (
    <div
      ref={boxRef}
      className={surfaceClassName ? `${variant === "followup" ? "followup" : "q-box"} ${surfaceClassName}` : variant === "followup" ? "followup" : "q-box"}
      data-testid="composer-pill"
      data-fill={length === 0 ? "0" : "some"}
      data-near={isNear}
      style={budgetFillStyle(maxLength > 0 ? (length / maxLength) * 100 : 0)}
      {...(accentCurrent === undefined ? {} : { "data-accent-current": accentCurrent })}
    >
      {variant === "question" && onAddInDepthDetails && (
        <button
          type="button"
          onClick={onAddInDepthDetails}
          disabled={addInDepthDetailsDisabled}
          aria-label={addInDepthDetailsLabel}
          title={`${addInDepthDetailsLabel} — your cards come with you`}
          data-testid="composer-pill-in-depth"
          className="deep"
        >
          <span className="glyph" aria-hidden="true">
            ◈
          </span>
          {/* The label hides below 480px (flow.css); the accessible name above always carries it. */}
          <span className="lbl" aria-hidden="true">
            In-depth
          </span>
        </button>
      )}

      <textarea
        ref={setTextarea}
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
        placeholder={dictation.isListening ? "Listening…" : (placeholders?.[0] ?? placeholder)}
        disabled={isSubmitting}
      />

      {/* The numeric "n / 300" is not drawn: the budget ring is the visual cue. Assistive tech still gets the remaining count. */}
      <span className="sr-only" role="status" aria-live="polite" data-testid="composer-pill-remaining">
        {maxLength - length} characters remaining
      </span>

      <span className="send-wrap">
        <svg className="send-ring" data-testid="composer-pill-ring" viewBox="0 0 88 48" aria-hidden="true">
          <path className="track" d={SEND_RING_PATH} pathLength={100} />
          <path className="fill" d={SEND_RING_PATH} pathLength={100} />
        </svg>
        <span className="send-pair">
          {/* REQ-212: the mic half exists only where the browser exposes speech recognition;
              where it does not, the pill is the arrow alone. */}
          {dictation.isSupported && <DictationMicButton isListening={dictation.isListening} onToggle={dictation.toggle} />}
          <button
            type="button"
            className="send"
            onClick={handleSubmit}
            disabled={submitDisabled}
            aria-label={isSubmitting ? pendingLabel : submitLabel}
            title={isSubmitting ? pendingLabel : submitLabel}
            data-testid="composer-pill-send"
          >
            {isSubmitting ? <span className="send-spinner" /> : "➤"}
          </button>
        </span>
      </span>
      {dictation.error && (
        <p role="alert" data-testid="composer-pill-dictation-error" className="q-error">
          {dictation.error}
        </p>
      )}
    </div>
  );
}
