import { useState, type FormEvent } from "react";
import { DictationMicButton } from "./DictationMicButton";
import { useDictation } from "../hooks/useDictation";
import { SendIcon } from "./ComposerSubmitButton";

const MAX_QUESTION_CHARS = 300;

type FollowUpComposerProps = {
  isSubmitting: boolean;
  onSubmit: (text: string) => Promise<void>;
};

export function FollowUpComposer({ isSubmitting, onSubmit }: FollowUpComposerProps): JSX.Element {
  const [text, setText] = useState("");
  const dictation = useDictation({ value: text, onChange: setText, maxLength: MAX_QUESTION_CHARS });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (dictation.isListening) dictation.stop();
    const trimmedText = text.trim();
    if (!trimmedText) return;
    setText("");
    await onSubmit(trimmedText);
  }

  return (
    <div className="space-y-1">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        data-accent-current={false}
        className="ambient-accent-surface ambient-accent-interactive flex items-end gap-2 rounded-3xl border border-zinc-700/70 bg-zinc-900/55 py-1.5 pl-4 pr-1.5"
      >
        <label className="flex min-w-0 flex-1 items-center">
          <span className="sr-only">Follow-up question</span>
          <textarea
            aria-label="Follow-up question"
            placeholder={dictation.isListening ? "Listening…" : "Ask a follow-up…"}
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_QUESTION_CHARS))}
            rows={1}
            maxLength={MAX_QUESTION_CHARS}
            disabled={isSubmitting}
            className="min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
          />
        </label>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="pr-0.5 text-xs text-zinc-500">
            {text.length}/{MAX_QUESTION_CHARS}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {dictation.isSupported && (
              <DictationMicButton
                isListening={dictation.isListening}
                onToggle={dictation.toggle}
                sizeClassName="h-9 w-9"
              />
            )}
            <button
              type="submit"
              aria-label="Send"
              disabled={isSubmitting || !text.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-strong text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <span className="send-spinner" /> : <SendIcon />}
            </button>
          </div>
        </div>
      </form>
      {dictation.error && (
        <p role="alert" className="px-4 text-[10px] leading-tight text-rose-400">
          {dictation.error}
        </p>
      )}
    </div>
  );
}
