import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StepEyebrow } from "./StepEyebrow";

afterEach(cleanup);

describe("Frontend - MTG Assistant", () => {
describe("StepEyebrow", () => {
  it("renders the step name as a heading", () => {
    render(<StepEyebrow stepName="Zone confirmation" />);

    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
  });

  it("uses the shared eyebrow class for in-flow positioning and typography", () => {
    render(<StepEyebrow stepName="Game context" />);

    expect(screen.getByRole("heading", { name: "Game context" })).toHaveClass("step-eyebrow");
  });
});
});
