import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConversationThread } from "./ConversationThread";
import type { ConversationMessage } from "../types";

afterEach(cleanup);

describe("ConversationThread", () => {
  it("adds the shared entrance cue to messages appended to the thread", () => {
    const messages: ConversationMessage[] = [
      { role: "assistant", content: "The stack resolves." }
    ];
    const { rerender } = render(<ConversationThread messages={messages} />);

    rerender(
      <ConversationThread
        messages={[...messages, { role: "user", content: "What about hexproof?" }]}
      />
    );

    expect(screen.getByText("What about hexproof?").parentElement).toHaveClass(
      "conversation-message",
      "motion-enter"
    );
  });
});
