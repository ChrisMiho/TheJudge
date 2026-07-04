import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ZoneConfirmStep } from "./ZoneConfirmStep";

afterEach(cleanup);

describe("ZoneConfirmStep", () => {
  it("shows direct guidance for selecting relevant zones", () => {
    render(
      <ZoneConfirmStep
        selectedZones={["stack"]}
        canContinue={true}
        onZoneToggle={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
        statusMessage={null}
      />
    );

    expect(
      screen.getByText("Select all zones that apply to your question.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        [
          "Select the zones relevant",
          "to your question.",
          "Defaults are pre-checked based on the turn phase."
        ].join(" ")
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Select each zone at the top of the screen to add cards to it.")
    ).not.toBeInTheDocument();
  });

  it("adds shared interaction feedback to zone choices and flow actions", () => {
    render(
      <ZoneConfirmStep
        selectedZones={["stack"]}
        canContinue={true}
        onZoneToggle={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
        statusMessage={null}
      />
    );

    expect(screen.getByText("Stack").closest("label")).toHaveClass(
      "motion-hover",
      "motion-press"
    );
    expect(screen.getByLabelText("Zone: Stack")).toHaveClass("motion-focus");
    expect(screen.getByRole("button", { name: "Back" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
  });

  it("opts every zone row into the shared contract and exposes current state only for checked rows", async () => {
    const user = userEvent.setup();

    function ControlledStep(): JSX.Element {
      const [selectedZones, setSelectedZones] = useState<Parameters<typeof ZoneConfirmStep>[0]["selectedZones"]>([
        "stack"
      ]);

      return (
        <ZoneConfirmStep
          selectedZones={selectedZones}
          canContinue={selectedZones.length > 0}
          onZoneToggle={(zone) =>
            setSelectedZones((current) =>
              current.includes(zone) ? current.filter((selected) => selected !== zone) : [...current, zone]
            )
          }
          onBack={() => undefined}
          onContinue={() => undefined}
          statusMessage={null}
        />
      );
    }

    render(<ControlledStep />);

    const zoneInputs = screen.getAllByRole("checkbox");
    expect(zoneInputs.length).toBeGreaterThan(1);
    zoneInputs.forEach((input) => {
      expect(input.closest("label")).toHaveClass(
        "ambient-accent-surface",
        "ambient-accent-interactive"
      );
    });

    expect(screen.getByLabelText("Zone: Stack").closest("label")).toHaveAttribute(
      "data-accent-current",
      "true"
    );
    expect(screen.getByLabelText("Zone: Battlefield").closest("label")).toHaveAttribute(
      "data-accent-current",
      "false"
    );

    await user.click(screen.getByLabelText("Zone: Battlefield"));
    await user.click(screen.getByLabelText("Zone: Stack"));

    expect(screen.getByLabelText("Zone: Battlefield").closest("label")).toHaveAttribute(
      "data-accent-current",
      "true"
    );
    expect(screen.getByLabelText("Zone: Stack").closest("label")).toHaveAttribute(
      "data-accent-current",
      "false"
    );
  });
});
