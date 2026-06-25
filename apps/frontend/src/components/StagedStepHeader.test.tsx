import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StagedStepHeader } from "./StagedStepHeader";

afterEach(cleanup);

describe("StagedStepHeader", () => {
  it("renders the brand block and the step name", () => {
    render(<StagedStepHeader stepName="Zone confirmation" />);

    expect(screen.getByRole("heading", { name: "TheJudge" })).toBeInTheDocument();
    expect(screen.getByText("Stack Assistant")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Zone confirmation" })).toBeInTheDocument();
  });
});
