import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AdaptiveContextDialog } from "./AdaptiveContextDialog";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

describe("Frontend - Adaptive context dialog", () => {
  it("opens an accessible portal dialog, traps focus, and restores the exact trigger on close", async () => {
    const user = userEvent.setup();
    render(
      <AdaptiveContextDialog
        triggerLabel="Combat · 2 populated zones"
        dialogLabel="Frozen game context"
      >
        <a href="#context-detail">First detail</a>
        <button type="button">Last action</button>
      </AdaptiveContextDialog>
    );

    const trigger = screen.getByRole("button", {
      name: "View context: Combat · 2 populated zones"
    });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Frozen game context" });
    const close = within(dialog).getByRole("button", { name: "Close frozen game context" });
    const lastAction = within(dialog).getByRole("button", { name: "Last action" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("adaptive-context-surface", "ambient-accent-surface");
    expect(dialog).toHaveAttribute("data-accent-current", "true");
    expect(dialog.closest(".page-card")).toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(close).toHaveFocus();

    lastAction.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastAction).toHaveFocus();

    await user.click(close);
    expect(screen.queryByRole("dialog", { name: "Frozen game context" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Frozen game context" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes and restores focus when the dimmed scrim outside the panel is activated", async () => {
    const user = userEvent.setup();
    render(
      <AdaptiveContextDialog triggerLabel="Combat · 2 populated zones" dialogLabel="Frozen game context">
        <button type="button">Last action</button>
      </AdaptiveContextDialog>
    );

    const trigger = screen.getByRole("button", { name: "View context: Combat · 2 populated zones" });
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toBeInTheDocument();
    await user.click(screen.getByTestId("adaptive-context-overlay"));

    expect(screen.queryByRole("dialog", { name: "Frozen game context" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not close when activating the panel surface itself", async () => {
    const user = userEvent.setup();
    render(
      <AdaptiveContextDialog triggerLabel="Combat · 2 populated zones" dialogLabel="Frozen game context">
        <button type="button">Last action</button>
      </AdaptiveContextDialog>
    );

    await user.click(screen.getByRole("button", { name: "View context: Combat · 2 populated zones" }));
    const dialog = screen.getByRole("dialog", { name: "Frozen game context" });

    await user.click(within(dialog).getByText("Frozen game context"));
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toBeInTheDocument();
  });

  it("uses one CSS-driven surface for the mobile sheet and desktop drawer", () => {
    expect(appCss).toMatch(
      /\.adaptive-context-overlay \{[^}]*align-items: flex-end;[^}]*\}/
    );
    expect(appCss).toMatch(
      /@media \(min-width: 768px\) \{[\s\S]*\.adaptive-context-overlay \{[^}]*align-items: stretch;[^}]*justify-content: flex-end;[^}]*\}[\s\S]*\.adaptive-context-surface \{[^}]*width: min\(/
    );
    expect(appCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.adaptive-context-surface/
    );
  });

  it("caps the phone sheet at 75dvh so a >=25% dismissible scrim stays reachable above it (REQ-135)", () => {
    const mobileSurfaceBlock = appCss.slice(
      appCss.indexOf(".adaptive-context-surface {"),
      appCss.indexOf("}", appCss.indexOf(".adaptive-context-surface {"))
    );

    expect(mobileSurfaceBlock).toContain("max-height: 75dvh");
    expect(mobileSurfaceBlock).not.toContain("min(85dvh, 48rem)");
  });

  it("carries no compensating top clearance now that the rail has a real in-flow footprint", () => {
    const triggerBlock = appCss.slice(
      appCss.indexOf(".adaptive-context-trigger {"),
      appCss.indexOf("}", appCss.indexOf(".adaptive-context-trigger {"))
    );

    // The rail participates in layout, so shared layout tokens own the spacing above
    // View Context — no one-off clearance constant sized to the rail's band.
    expect(triggerBlock).not.toContain("margin-top");
    expect(triggerBlock).not.toContain("2.75rem");
    expect(triggerBlock).not.toContain("clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem)");
    expect(triggerBlock).toContain("min-height: 44px");
  });
});
