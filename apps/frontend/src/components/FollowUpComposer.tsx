import { useState, type FormEvent } from "react";

const MAX_QUESTION_CHARS = 300;

type FollowUpComposerProps = {
  isSubmitting: boolean;
  onSubmit: (text: string) => Promise<void>;
};

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
      className="ambient-accent-surface ambient-accent-interactive space-y-2 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
          Follow-up question
        </span>
        <textarea
          aria-label="Follow-up question"
          placeholder="Ask a follow-up…"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_QUESTION_CHARS))}
          rows={2}
          maxLength={MAX_QUESTION_CHARS}
          disabled={isSubmitting}
          className="resize-none rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 disabled:opacity-60"
        />
        <span className="text-right text-xs text-zinc-500">
          {text.length}/{MAX_QUESTION_CHARS}
        </span>
      </label>
      <button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? <span className="send-spinner" /> : "Send"}
      </button>
    </form>
  );
}
