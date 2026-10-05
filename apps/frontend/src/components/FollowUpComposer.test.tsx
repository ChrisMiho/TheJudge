import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FollowUpComposer } from "./FollowUpComposer";
import {
  getLastDictationInstance,
  installStubSpeechRecognition,
  makeDictationResultsEvent
} from "../test/stubSpeechRecognition";

afterEach(cleanup);

describe("Frontend - Conversation composer", () => {
  describe("FollowUpComposer", () => {
    it("renders as the shared composer pill with a visually-hidden accessible label", () => {
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      // Look-matching pass (slice M, review 1 fix — finding 4): the follow-up box is
      // now `ComposerPill` itself (`.q-box`, `flow.css:187-216`), the same split
      // mic/send pill the main composer uses — no separate `<form>` wrapper of its
      // own any more.
      expect(screen.getByTestId("composer-pill")).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Follow-up question" })).toBeInTheDocument();
    });

    it("renders the mockup's ➤ send glyph instead of a text label", () => {
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(sendButton).toHaveTextContent("➤");
      expect(sendButton).toHaveClass("send");
    });

    it("blocks blank submission and submits trimmed text, clearing the input", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(async () => undefined);
      render(<FollowUpComposer isSubmitting={false} onSubmit={onSubmit} />);

      const composer = screen.getByRole("textbox", { name: "Follow-up question" });
      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(sendButton).toBeDisabled();

      await user.type(composer, "  What about hexproof?  ");
      expect(sendButton).not.toBeDisabled();
      await user.click(sendButton);

      expect(onSubmit).toHaveBeenCalledWith("What about hexproof?");
      expect(composer).toHaveValue("");
    });

    it("caps input at MAX_QUESTION_CHARS and reflects the count", async () => {
      const user = userEvent.setup();
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      const composer = screen.getByRole("textbox", { name: "Follow-up question" });
      await user.type(composer, "a".repeat(310));

      expect(composer).toHaveValue("a".repeat(300));
      expect(screen.queryByText("300 / 300")).not.toBeInTheDocument();
      expect(screen.getByTestId("composer-pill-remaining")).toHaveTextContent("0 characters remaining");

      // Look-matching pass (slice M, review 1 fix — finding 4): `ComposerPill` only
      // shows the count badge once there is something to count (REQ-206's
      // content-sized composer — an empty box carries no "0/300"), so clearing the
      // field hides the badge instead of showing "0/300".
      await user.clear(composer);
      // An empty box marks itself data-fill="0"; the ring is the only budget cue and no numeric count is drawn.
      expect(screen.getByTestId("composer-pill")).toHaveAttribute("data-fill", "0");
      await user.type(composer, "abc");
      expect(screen.queryByText("3 / 300")).not.toBeInTheDocument();
      expect(screen.getByTestId("composer-pill-remaining")).toHaveTextContent("297 characters remaining");
    });

    it("shows a spinner and disables the control while submitting", () => {
      render(<FollowUpComposer isSubmitting onSubmit={vi.fn(async () => undefined)} />);

      const composer = screen.getByRole("textbox", { name: "Follow-up question" });
      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(composer).toBeDisabled();
      expect(sendButton).toBeDisabled();
      expect(sendButton.querySelector(".send-spinner")).toBeInTheDocument();
    });
  });

  describe("FollowUpComposer dictation (REQ-212)", () => {
    let uninstall: () => void;

    beforeEach(() => {
      uninstall = installStubSpeechRecognition();
    });

    afterEach(() => {
      uninstall();
    });

    it("shows a mic control, inserts recognised text, and stops on submit", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(async () => undefined);
      render(<FollowUpComposer isSubmitting={false} onSubmit={onSubmit} />);

      const mic = screen.getByTestId("dictation-mic");
      expect(mic).toHaveAccessibleName("Dictate question");
      await user.click(mic);
      expect(getLastDictationInstance().start).toHaveBeenCalledTimes(1);

      act(() => {
        getLastDictationInstance().onresult!(makeDictationResultsEvent(["does trample help"]));
      });
      expect(screen.getByRole("textbox", { name: "Follow-up question" })).toHaveValue(
        "does trample help"
      );

      await user.click(screen.getByRole("button", { name: "Send" }));
      expect(getLastDictationInstance().stop).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith("does trample help");
    });

    it("surfaces a one-line message on a denied microphone", async () => {
      const user = userEvent.setup();
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      await user.click(screen.getByTestId("dictation-mic"));
      act(() => {
        getLastDictationInstance().onerror!({ error: "not-allowed" });
      });

      expect(screen.getByRole("alert")).toHaveTextContent("Microphone access was denied.");
    });
  });
});
