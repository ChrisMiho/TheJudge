import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StagedStepHeader } from "./StagedStepHeader";
import { PortalSlotContext } from "../lib/portal/slotContext";

afterEach(cleanup);

describe("Frontend - MTG Assistant", () => {
describe("StagedStepHeader", () => {
  it("renders the brand block, centered, with no step-name text", () => {
    render(<StagedStepHeader />);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.getByText("MTG Assistant")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /./, level: 2 })).not.toBeInTheDocument();
  });

  it("exposes semantic hooks for automatic responsive typography", () => {
    render(<StagedStepHeader />);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toHaveClass("staged-step-brand");
  });

  it("adds shared interaction feedback when the brand is clickable", () => {
    render(<StagedStepHeader onBrandClick={() => undefined} />);

    expect(screen.getByRole("button", { name: "TheJudge" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
  });

  it("threads an optional historyTrigger into its PortalSlot registration", () => {
    const registerSlot = vi.fn();
    const unregisterSlot = vi.fn();
    const onOpen = vi.fn();

    render(
      <PortalSlotContext.Provider value={{ registerSlot, unregisterSlot }}>
        <StagedStepHeader historyTrigger={{ onOpen }} />
      </PortalSlotContext.Provider>
    );

    expect(registerSlot).toHaveBeenCalledTimes(1);
    const getHistoryTrigger = registerSlot.mock.calls[0][1] as () => { onOpen: () => void } | undefined;
    expect(getHistoryTrigger()).toEqual({ onOpen });
  });
});
});
