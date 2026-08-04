import { useState, type FormEvent } from "react";

const MAX_QUESTION_CHARS = 300;

type FollowUpComposerProps = {
  isSubmitting: boolean;
  onSubmit: (text: string) => Promise<void>;
};

/** Consistent with the corner rail's inline stroke-SVG icon convention (DEC-126). */
function SendIcon(): JSX.Element {
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

export function FollowUpComposer({ isSubmitting, onSubmit }: FollowUpComposerProps): JSX.Element {
  const [text, setText] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;
    setText("");
    await onSubmit(trimmedText);
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      data-accent-current={false}
      className="ambient-accent-surface ambient-accent-interactive flex items-center gap-2 rounded-full border border-zinc-700/70 bg-zinc-900/55 py-1.5 pl-4 pr-1.5"
    >
      <label className="flex min-w-0 flex-1 items-center">
        <span className="sr-only">Follow-up question</span>
        <textarea
          aria-label="Follow-up question"
          placeholder="Ask a follow-up…"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_QUESTION_CHARS))}
          rows={1}
          maxLength={MAX_QUESTION_CHARS}
          disabled={isSubmitting}
          className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
        />
      </label>
      <span className="shrink-0 text-xs text-zinc-500">
        {text.length}/{MAX_QUESTION_CHARS}
      </span>
      <button
        type="submit"
        aria-label="Send"
        disabled={isSubmitting || !text.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-strong text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? <span className="send-spinner" /> : <SendIcon />}
      </button>
    </form>
  );
}
