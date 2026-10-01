import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StationsRail } from "./StationsRail";

afterEach(() => {
  cleanup();
});

describe("StationsRail", () => {
  it("renders the four stations in order with their numbers", () => {
    render(<StationsRail currentStep="game-context" furthestStepIndex={0} onNavigate={() => undefined} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["1Game", "2Zones", "3Cards", "4Context"]);
  });

  it("marks the current station with aria-current and earlier ones done", () => {
    render(<StationsRail currentStep="zone-collection" furthestStepIndex={2} onNavigate={() => undefined} />);

    expect(screen.getByRole("button", { name: "Station 3: Cards" })).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Station 1: Game" })).toHaveAttribute("data-done", "true");
    expect(screen.getByRole("button", { name: "Station 2: Zones" })).toHaveAttribute("data-done", "true");
    expect(screen.getByRole("button", { name: "Station 4: Context" })).toHaveAttribute("data-done", "false");
  });

  it("disables a station past the furthest one reached", () => {
    render(<StationsRail currentStep="game-context" furthestStepIndex={0} onNavigate={() => undefined} />);

    expect(screen.getByRole("button", { name: "Station 1: Game" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Station 2: Zones" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Station 3: Cards" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Station 4: Context" })).toBeDisabled();
  });

  it("calls onNavigate with the tapped station's step id", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StationsRail currentStep="zone-collection" furthestStepIndex={2} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Station 1: Game" }));
    expect(onNavigate).toHaveBeenCalledWith("game-context");
  });

  it("never calls onNavigate for a disabled, unreached station", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StationsRail currentStep="game-context" furthestStepIndex={0} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Station 3: Cards" }));
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
