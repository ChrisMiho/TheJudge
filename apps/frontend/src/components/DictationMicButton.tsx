/** The mockup's mic glyph (`flow.js` MIC_SVG), drawn in `currentColor`. */
function MicIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="2" width="6" height="10" rx="3" fill="currentColor" />
      <path
        d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v3M7 18h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface DictationMicButtonProps {
  isListening: boolean;
  onToggle: () => void;
}

/**
 * REQ-212: the microphone half of the question box's mic|send pill — the mockup's
 * `.send-pair .mic` (`flow.css` sizes, draws the seam and lights it while it listens).
 * Rendered only where the browser exposes speech recognition.
 */
export function DictationMicButton({ isListening, onToggle }: DictationMicButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className="mic"
      onClick={onToggle}
      aria-label={isListening ? "Stop dictating" : "Dictate question"}
      title={isListening ? "Stop dictating" : "Dictate question"}
      aria-pressed={isListening}
      data-testid="dictation-mic"
    >
      <MicIcon />
    </button>
  );
}
