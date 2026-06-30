import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ZoneConfirmStep } from "./ZoneConfirmStep";

afterEach(cleanup);

describe("ZoneConfirmStep", () => {
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
});
