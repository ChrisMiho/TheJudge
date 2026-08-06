import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerSubmitButton } from "./ComposerSubmitButton";

afterEach(cleanup);

describe("Frontend - Conversation composer", () => {
  describe("ComposerSubmitButton", () => {
    it("defaults to hiding the visible label below `sm` (icon-only), matching the answered-view pattern", () => {
      render(
        <ComposerSubmitButton
          label="Ask TheJudge"
          pendingLabel="Asking…"
          isSubmitting={false}
          disabled={false}
        />
      );

      const button = screen.getByRole("button", { name: "Ask TheJudge" });
      const iconSpan = button.querySelector("span.sm\\:hidden");
      const textSpan = button.querySelector("span.hidden.sm\\:inline");
      expect(iconSpan?.querySelector("svg")).toBeInTheDocument();
      expect(textSpan).toHaveTextContent("Ask TheJudge");
    });

    it("shows a spinner and disables the control while submitting (default variant)", () => {
      render(
        <ComposerSubmitButton
          label="Ask TheJudge"
          pendingLabel="Asking…"
          isSubmitting
          disabled
        />
      );

      const button = screen.getByRole("button", { name: "Ask TheJudge" });
      expect(button).toBeDisabled();
      expect(button.querySelector(".send-spinner")).toBeInTheDocument();
    });

    it("showLabelBelowSm renders the visible label at every width, with no icon-only span", () => {
      render(
        <ComposerSubmitButton
          label="Decrypt Stack"
          visibleLabel="Send Request"
          pendingLabel="Decrypting…"
          isSubmitting={false}
          disabled={false}
          showLabelBelowSm
        />
      );

      const button = screen.getByRole("button", { name: "Decrypt Stack" });
      expect(button).toHaveTextContent("Send Request");
      expect(button.querySelector("svg")).not.toBeInTheDocument();
      expect(button.querySelector(".sm\\:hidden")).not.toBeInTheDocument();
      expect(button.querySelector(".hidden.sm\\:inline")).not.toBeInTheDocument();
    });

    it("showLabelBelowSm keeps a distinct accessible name from the visible label", () => {
      render(
        <ComposerSubmitButton
          label="Ask TheJudge"
          visibleLabel="Send Request"
          pendingLabel="Asking…"
          isSubmitting={false}
          disabled={false}
          showLabelBelowSm
        />
      );

      const button = screen.getByRole("button", { name: "Ask TheJudge" });
      expect(button).toHaveTextContent("Send Request");
      expect(button).not.toHaveTextContent("Ask TheJudge");
    });

    it("showLabelBelowSm shows the pending label while submitting", () => {
      render(
        <ComposerSubmitButton
          label="Decrypt Stack"
          visibleLabel="Send Request"
          pendingLabel="Decrypting…"
          isSubmitting
          disabled
          showLabelBelowSm
        />
      );

      const button = screen.getByRole("button", { name: "Decrypt Stack" });
      expect(button).toHaveTextContent("Decrypting…");
      expect(button).toBeDisabled();
    });

    it("visibleLabel defaults to label when omitted, even with showLabelBelowSm", () => {
      render(
        <ComposerSubmitButton
          label="Ask TheJudge"
          pendingLabel="Asking…"
          isSubmitting={false}
          disabled={false}
          showLabelBelowSm
        />
      );

      const button = screen.getByRole("button", { name: "Ask TheJudge" });
      expect(button).toHaveTextContent("Ask TheJudge");
    });

    it("disables the control via the disabled prop regardless of variant", () => {
      const onSubmit = vi.fn();
      render(
        <form onSubmit={onSubmit}>
          <ComposerSubmitButton
            label="Ask TheJudge"
            visibleLabel="Send Request"
            pendingLabel="Asking…"
            isSubmitting={false}
            disabled
            showLabelBelowSm
          />
        </form>
      );

      expect(screen.getByRole("button", { name: "Ask TheJudge" })).toBeDisabled();
    });
  });
});
