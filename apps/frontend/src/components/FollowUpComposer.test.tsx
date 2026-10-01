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
    it("renders as a rounded pill with a visually-hidden accessible label", () => {
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      const composer = screen.getByRole("textbox", { name: "Follow-up question" });
      // REQ-212: the right side now stacks a character count above the send (and, where
      // supported, mic) controls, matching ComposerPill's own shape — the pill is no
      // longer a single flat row, but keeps the same rounded family.
      expect(composer.closest("form")?.className).toContain("rounded-3xl");
      expect(screen.getByText("Follow-up question")).toHaveClass("sr-only");
    });

    it("renders a circular icon send control instead of a text label", () => {
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(sendButton).not.toHaveTextContent("Send");
      expect(sendButton.querySelector("svg")).toBeInTheDocument();
      expect(sendButton.className).toContain("rounded-full");
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
      expect(screen.getByText("300/300")).toBeInTheDocument();

      // The count tracks the raw editable value, so clearing returns it to zero.
      await user.clear(composer);
      expect(screen.getByText("0/300")).toBeInTheDocument();
      await user.type(composer, "abc");
      expect(screen.getByText("3/300")).toBeInTheDocument();
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
