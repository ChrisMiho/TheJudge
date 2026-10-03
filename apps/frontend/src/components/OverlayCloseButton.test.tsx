import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OverlayCloseButton } from "./OverlayCloseButton";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const shellCss = readFileSync(resolve(process.cwd(), "src/styles/shell.css"), "utf8");

describe("Frontend - Shared", () => {
  describe("OverlayCloseButton", () => {
    it("renders an icon-only control with the given accessible name and a 44x44px hit area", () => {
      render(<OverlayCloseButton label="Close feedback" onClick={vi.fn()} />);

      const button = screen.getByRole("button", { name: "Close feedback" });
      expect(button).not.toHaveTextContent(/close/i);
      expect(button).toHaveClass("icon-btn", "overlay-close");
      // `.icon-btn` (shell.css) paints at least 44x44px (REQ-205).
      expect(shellCss).toMatch(/\.menu-toggle,\s*\.icon-btn \{[^}]*min-width: 44px;[^}]*min-height: 44px;/);
    });

    it("calls onClick when activated", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<OverlayCloseButton label="Close feedback" onClick={onClick} />);

      await user.click(screen.getByRole("button", { name: "Close feedback" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("derives its color from the accent theme tokens, not hardcoded zinc chrome", () => {
      render(<OverlayCloseButton label="Close feedback" onClick={vi.fn()} />);

      // REQ-142 wins over the mockup's plain glyph: the colour comes from the active profile's token.
      expect(appCss).toMatch(/\.drawer-panel \.overlay-close \{\s*color: var\(--accent-soft\);/);
      expect(screen.getByRole("button", { name: "Close feedback" }).getAttribute("style")).toBeNull();
    });

    it("forwards a ref to the underlying button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<OverlayCloseButton ref={ref} label="Close feedback" onClick={vi.fn()} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole("button", { name: "Close feedback" }));
    });
  });
});
