import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StagedStepHeader } from "./StagedStepHeader";

afterEach(cleanup);

describe("StagedStepHeader", () => {
  it("renders the brand block and the step name", () => {
    render(<StagedStepHeader stepName="Zone confirmation" />);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.getByText("MTG Assistant")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
  });

  it("exposes density surface hooks for slim typography overrides", () => {
    render(<StagedStepHeader stepName="Zone confirmation" />);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toHaveClass("staged-step-brand");
    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toHaveClass("staged-step-name");
  });

  it("adds shared interaction feedback when the brand is clickable", () => {
    render(<StagedStepHeader stepName="Game context" onBrandClick={() => undefined} />);

    expect(screen.getByRole("button", { name: "TheJudge" })).toHaveClass(
      "motion-hover",
      "motion-press",
      "motion-focus"
    );
  });
});
