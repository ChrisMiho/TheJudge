import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmSheet } from "./ConfirmSheet";

afterEach(cleanup);

describe("Frontend - ConfirmSheet", () => {
  it("is built on SheetShell and asks a plain question with one clearing detail line", () => {
    render(
      <ConfirmSheet
        isOpen
        onKeep={vi.fn()}
        onConfirm={vi.fn()}
        question="Start a new trade?"
        detail="This clears both piles."
        confirmLabel="New trade"
        testId="trade-confirm"
      />
    );

    const dialog = screen.getByTestId("trade-confirm");
    expect(dialog).toHaveClass("drawer-panel", "confirm-panel");
    // the mockup's confirm sheet has no ✕: Keep, Esc and the backdrop dismiss it
    expect(screen.queryByRole("button", { name: /^Keep —/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start a new trade?" })).toBeInTheDocument();
    expect(screen.getByText("This clears both piles.")).toBeInTheDocument();
  });

  it("offers a keep action and the destructive action's own label", async () => {
    const user = userEvent.setup();
    const onKeep = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmSheet
        isOpen
        onKeep={onKeep}
        onConfirm={onConfirm}
        question="Start a new trade?"
        detail="This clears both piles."
        confirmLabel="New trade"
      />
    );

    await user.click(screen.getByRole("button", { name: "Keep" }));
    expect(onKeep).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "New trade" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed — the caller decides whether there is anything to clear", () => {
    render(
      <ConfirmSheet
        isOpen={false}
        onKeep={vi.fn()}
        onConfirm={vi.fn()}
        question="Reset life totals?"
        detail="This sets every player back to their starting total."
        confirmLabel="Reset life totals"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes to the keep path on Escape and the ✕ control", async () => {
    const user = userEvent.setup();
    const onKeep = vi.fn();
    render(
      <ConfirmSheet
        isOpen
        onKeep={onKeep}
        onConfirm={vi.fn()}
        question="Start a new game?"
        detail="This resets every player's life total and clears the board."
        confirmLabel="New game"
      />
    );

    await user.keyboard("{Escape}");
    expect(onKeep).toHaveBeenCalledTimes(1);
  });
});
