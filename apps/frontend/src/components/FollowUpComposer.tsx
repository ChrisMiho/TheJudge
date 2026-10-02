import { useState } from "react";
import { ComposerPill } from "./ComposerPill";

const MAX_QUESTION_CHARS = 300;

type FollowUpComposerProps = {
  isSubmitting: boolean;
  onSubmit: (text: string) => Promise<void>;
};

/**
 * Look-matching pass (slice M, review 1 fix — finding 4): the follow-up box reuses
 * `ComposerPill`, the same split mic/send pill and 300-character budget ring the
 * main composer uses (`flow.css:187-274`), instead of its own hand-rolled row with
 * two separate round mic/send circles and a "0/300" count line stacked above them
 * (LOOK-GAPS.md's Ask a Question section, "Follow-up box": "The mockup uses the
 * same split pill as the composer"). Behaviour is unchanged: the field's
 * accessible name stays "Follow-up question", the send control's stays "Send", a
 * blank submission is still blocked, the field still clears on send, and dictation
 * still stops before submit (`ComposerPill`'s own `handleSubmit` already does
 * this). `pendingLabel` repeats `submitLabel` so the send control's accessible
 * name never changes while sending, matching this composer's existing contract.
 */
export function FollowUpComposer({ isSubmitting, onSubmit }: FollowUpComposerProps): JSX.Element {
  const [text, setText] = useState("");

  function handleSubmit(): void {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    setText("");
    void onSubmit(trimmedText);
  }

  return (
    <ComposerPill
      value={text}
      onChange={setText}
      onSubmit={handleSubmit}
      maxLength={MAX_QUESTION_CHARS}
      placeholder="Ask a follow-up…"
      textareaAriaLabel="Follow-up question"
      submitLabel="Send"
      pendingLabel="Send"
      isSubmitting={isSubmitting}
      disabled={!text.trim()}
      surfaceClassName="ambient-accent-surface ambient-accent-interactive"
      accentCurrent={false}
    />
  );
}
