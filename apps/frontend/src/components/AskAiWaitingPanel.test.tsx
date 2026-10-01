import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskAiWaitingPanel } from "./AskAiWaitingPanel";
import { WAIT_STAGES } from "../lib/askAiWaitStages";

describe("Frontend - MTG Assistant", () => {
describe("AskAiWaitingPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders aria-live='polite' region", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute("aria-atomic")).toBe("true");
  });

  it("shows initial message matching WAIT_STAGES[0].message", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(screen.getByText(WAIT_STAGES[0].message)).toBeDefined();
  });

  it("updates message to 8s threshold after 8s", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText(WAIT_STAGES[2].message)).toBeDefined();
  });

  it("shows 0:00 timer initially", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(screen.getByText("0:00")).toBeDefined();
  });

  it("shows 1:05 after 65s", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    act(() => {
      vi.advanceTimersByTime(65000);
    });
    expect(screen.getByText("1:05")).toBeDefined();
  });

  it("applies wait-stage-calm class initially", () => {
    const { container } = render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(container.firstChild).toHaveClass("wait-stage-calm");
  });

  it("applies wait-stage-absurd class after 40s", () => {
    const { container } = render(<AskAiWaitingPanel isSubmitting={true} />);
    act(() => {
      vi.advanceTimersByTime(40000);
    });
    expect(container.firstChild).toHaveClass("wait-stage-absurd");
  });
});

describe("AskAiWaitingPanel ink-in inscription (REQ-023)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the bubble as the judge's seal with a turning ring and two motes", () => {
    const { container } = render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(container.querySelector(".wait-inscription-seal")).not.toBeNull();
    expect(container.querySelector(".wait-inscription-seal-ring")).not.toBeNull();
    expect(container.querySelectorAll(".wait-inscription-mote")).toHaveLength(2);
  });

  it("gives the current threshold line the ink-in class", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(screen.getByText(WAIT_STAGES[0].message)).toHaveClass("wait-inscription-line-ink");
  });

  it("sets the absurd-tone line in italics", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    act(() => {
      vi.advanceTimersByTime(25000);
    });
    expect(screen.getByText(WAIT_STAGES[4].message)).toHaveClass("italic");
  });

  it("does not italicize a calm or curious line", () => {
    render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(screen.getByText(WAIT_STAGES[0].message)).not.toHaveClass("italic");
  });

  it("keeps the previous line rendered, lifting away, until the lift-away animation's own duration elapses", () => {
    const { container } = render(<AskAiWaitingPanel isSubmitting={true} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(WAIT_STAGES[1].message)).toBeInTheDocument();
    const lifting = container.querySelector(".wait-inscription-line-lift");
    expect(lifting).not.toBeNull();
    expect(lifting).toHaveTextContent(WAIT_STAGES[0].message);
    expect(lifting).toHaveAttribute("aria-hidden", "true");

    act(() => {
      vi.advanceTimersByTime(280);
    });
    expect(container.querySelector(".wait-inscription-line-lift")).toBeNull();
    // The current line is unaffected by the outgoing line's cleanup.
    expect(screen.getByText(WAIT_STAGES[1].message)).toBeInTheDocument();
  });

  it("uses no canvas element and no script-driven animation loop — only CSS keyframes", () => {
    const { container } = render(<AskAiWaitingPanel isSubmitting={true} />);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("keeps the wait's CSS-only motion rules to clip-path, opacity, and transform (NFR-006)", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
    const inkReveal = css.slice(css.indexOf("@keyframes wait-inscription-ink-reveal"), css.indexOf("@keyframes wait-inscription-ink-glow"));
    expect(inkReveal).toContain("clip-path");
    expect(inkReveal).not.toMatch(/\bwidth\s*:/);
    expect(inkReveal).not.toMatch(/\bleft\s*:/);
  });

  it("stills the new ink/seal/mote/breathe decoration under prefers-reduced-motion, leaving the existing functional wait-stage pulse exempt (reduced-motion.test.ts)", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
    const reducedMotionBlock = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotionBlock).not.toContain(".wait-stage");
    for (const className of [
      ".wait-inscription-line-ink",
      ".wait-inscription-line-lift",
      ".wait-inscription-seal-ring",
      ".wait-inscription-mote",
      ".wait-inscription-bubble"
    ]) {
      expect(reducedMotionBlock).toContain(className);
    }
  });
});
});
