import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OverlayCloseButton } from "./OverlayCloseButton";

afterEach(cleanup);

describe("Frontend - Shared", () => {
  describe("OverlayCloseButton", () => {
    it("renders an icon-only control with the given accessible name and a 44x44px hit area", () => {
      render(<OverlayCloseButton label="Close feedback" onClick={vi.fn()} />);

      const button = screen.getByRole("button", { name: "Close feedback" });
      expect(button).not.toHaveTextContent(/close/i);
      expect(button.className).toContain("h-11");
      expect(button.className).toContain("w-11");
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

      const button = screen.getByRole("button", { name: "Close feedback" });
      expect(button.className).toContain("accent");
      expect(button.className).not.toContain("border-zinc");
      expect(button.className).not.toContain("bg-zinc-800");
      expect(button.className).not.toContain("text-zinc-300");
    });

    it("forwards a ref to the underlying button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<OverlayCloseButton ref={ref} label="Close feedback" onClick={vi.fn()} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole("button", { name: "Close feedback" }));
    });
  });
});
