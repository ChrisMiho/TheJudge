import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SheetShell } from "./SheetShell";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

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

  it("separates head, body and foot into fixed/scrolling regions", () => {
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
    expect(dialog).toHaveClass("sheet-shell-surface");
    const head = screen.getByTestId("example-sheet-head");
    const body = screen.getByTestId("example-sheet-body");
    const foot = screen.getByTestId("example-sheet-foot");
    expect(head).toHaveClass("sheet-shell-head");
    expect(body).toHaveClass("sheet-shell-body");
    expect(foot).toHaveClass("sheet-shell-foot");
    expect(within(head).getByText("Example head")).toBeInTheDocument();
    expect(within(body).getByText("Scrolling body")).toBeInTheDocument();
    expect(within(foot).getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("omits the foot region entirely when none is supplied", () => {
    renderShell(vi.fn());
    expect(screen.queryByTestId("example-sheet-foot")).not.toBeInTheDocument();
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

  it("is a bottom sheet below the sheet-family 600px breakpoint and a centred floating card from it", () => {
    expect(appCss).toMatch(/\.sheet-shell-overlay \{[^}]*align-items: flex-end;[^}]*justify-content: center;[^}]*\}/);
    expect(appCss).toMatch(
      /@media \(min-width: 600px\) \{[\s\S]*\.sheet-shell-overlay \{[^}]*align-items: center;[^}]*\}[\s\S]*\.sheet-shell-surface \{[^}]*width: min\(/
    );
  });

  it("keeps the head and foot fixed with only the body region scrolling", () => {
    const surfaceBlock = appCss.slice(
      appCss.indexOf(".sheet-shell-surface {"),
      appCss.indexOf("}", appCss.indexOf(".sheet-shell-surface {"))
    );
    expect(surfaceBlock).toContain("display: flex");
    expect(surfaceBlock).toContain("flex-direction: column");
    expect(surfaceBlock).toContain("overflow: hidden");

    const headBlock = appCss.slice(
      appCss.indexOf(".sheet-shell-head {"),
      appCss.indexOf("}", appCss.indexOf(".sheet-shell-head {"))
    );
    expect(headBlock).toContain("flex: 0 0 auto");

    const bodyBlock = appCss.slice(
      appCss.indexOf(".sheet-shell-body {"),
      appCss.indexOf("}", appCss.indexOf(".sheet-shell-body {"))
    );
    expect(bodyBlock).toContain("flex: 1 1 auto");
    expect(bodyBlock).toContain("overflow-y: auto");

    const footBlock = appCss.slice(
      appCss.indexOf(".sheet-shell-foot {"),
      appCss.indexOf("}", appCss.indexOf(".sheet-shell-foot {"))
    );
    expect(footBlock).toContain("flex: 0 0 auto");
  });

  it("honors prefers-reduced-motion for both overlay and surface", () => {
    expect(appCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.sheet-shell-overlay,[\s\S]*\.sheet-shell-surface/);
  });
});
