import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SheetShell } from "./SheetShell";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const shellCss = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf8");

function renderShell(onClose: () => void) {
  return render(
    <SheetShell isOpen onClose={onClose} closeLabel="Close example" titleId="example-title" testId="example-sheet">
      <p>Body content</p>
      <button type="button">Deep action</button>
    </SheetShell>
  );
}

describe("Frontend - SheetShell", () => {
  it("renders nothing while closed and mounts a labelled dialog when open", () => {
    const { rerender } = render(
      <SheetShell isOpen={false} onClose={vi.fn()} closeLabel="Close example" titleId="example-title" testId="example-sheet">
        <p>Body content</p>
      </SheetShell>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <SheetShell isOpen onClose={vi.fn()} closeLabel="Close example" titleId="example-title" testId="example-sheet">
        <h2 id="example-title">Example</h2>
        <p>Body content</p>
      </SheetShell>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the mockup's panel: a backdrop, then an aside.drawer-panel with the ✕ first and the caller's own markup after it", () => {
    render(
      <SheetShell
        isOpen
        onClose={vi.fn()}
        closeLabel="Close example"
        titleId="example-title"
        panelId="example-panel"
        panelClassName="example-panel"
        testId="example-sheet"
      >
        <h2 id="example-title">Example head</h2>
        <p>Body</p>
      </SheetShell>
    );

    const dialog = screen.getByTestId("example-sheet");
    expect(dialog.tagName).toBe("ASIDE");
    expect(dialog).toHaveClass("drawer-panel", "example-panel");
    expect(dialog).toHaveAttribute("id", "example-panel");
    expect(dialog.firstElementChild).toHaveClass("icon-btn", "overlay-close");
    expect(screen.getByTestId("example-sheet-overlay")).toHaveClass("sheet-backdrop");
    expect(within(dialog).getByText("Example head")).toBeInTheDocument();
  });

  it("can omit the ✕ (the confirm sheet has none: Keep, Esc and the backdrop dismiss it)", () => {
    render(
      <SheetShell isOpen onClose={vi.fn()} closeLabel="Close example" titleId="t" showCloseButton={false} testId="example-sheet">
        <h2 id="t">Example</h2>
      </SheetShell>
    );
    expect(screen.queryByRole("button", { name: "Close example" })).not.toBeInTheDocument();
  });

  it("still renders legacy head, body and foot regions for sheets not yet ported", () => {
    render(
      <SheetShell
        isOpen
        onClose={vi.fn()}
        closeLabel="Close example"
        titleId="example-title"
        testId="example-sheet"
        head={<h2 id="example-title">Example head</h2>}
        foot={<button type="button">Confirm</button>}
      >
        <p>Scrolling body</p>
      </SheetShell>
    );

    const dialog = screen.getByTestId("example-sheet");
    expect(within(dialog).getByText("Example head").closest(".sheet-legacy-head")).not.toBeNull();
    expect(within(dialog).getByText("Scrolling body").closest(".sheet-legacy-body")).not.toBeNull();
    expect(within(dialog).getByRole("button", { name: "Confirm" }).closest(".sheet-legacy-foot")).not.toBeNull();
  });

  it("traps focus, closes on Escape and the close control, and restores the trigger", async () => {
    const user = userEvent.setup();
    function Host() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Open
          </button>
          <SheetShell
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            closeLabel="Close example"
            titleId="example-title"
            testId="example-sheet"
            head={<h2 id="example-title">Example</h2>}
          >
            <button type="button">Deep action</button>
          </SheetShell>
        </>
      );
    }

    render(<Host />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", { name: "Close example" });
    expect(close).toHaveFocus();

    const deepAction = within(dialog).getByRole("button", { name: "Deep action" });
    deepAction.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(deepAction).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside click but not on an interaction with the surface itself", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderShell(onClose);

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByText("Body content"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("example-sheet-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is a bottom sheet on a phone and a centred floating glass card from 768px (shell.css's .drawer-panel)", () => {
    expect(shellCss).toMatch(/\.drawer-panel \{[^}]*top: 50%;[^}]*left: 50%;[^}]*backdrop-filter: blur\(18px\)/);
    expect(shellCss).toMatch(
      /@media \(max-width: 767px\) \{\s*\.drawer-panel \{[^}]*bottom: 0;[^}]*max-height: 88dvh;[^}]*transform: translateY\(100%\)/
    );
  });

  it("slides and fades only through transforms and opacity, and holds still under prefers-reduced-motion", () => {
    expect(shellCss).toMatch(/\.drawer-panel \{[^}]*transition: transform 0\.26s[^}]*opacity 0\.18s/);
    expect(appCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^}]*\.drawer-panel,[^}]*\.sheet-backdrop[^}]*transition: none/);
  });
});
