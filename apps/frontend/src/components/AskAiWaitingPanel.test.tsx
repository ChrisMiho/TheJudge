import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskAiWaitingPanel } from "./AskAiWaitingPanel";
import { WAIT_STAGES } from "../lib/askAiWaitStages";

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
