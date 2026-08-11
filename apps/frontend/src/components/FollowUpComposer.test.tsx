import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FollowUpComposer } from "./FollowUpComposer";

afterEach(cleanup);

describe("Frontend - Conversation composer", () => {
  describe("FollowUpComposer", () => {
    it("renders as a single-row pill with a visually-hidden accessible label", () => {
      render(<FollowUpComposer isSubmitting={false} onSubmit={vi.fn(async () => undefined)} />);

      const composer = screen.getByRole("textbox", { name: "Follow-up question" });
      expect(composer.closest("form")?.className).toContain("rounded-full");
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
});
