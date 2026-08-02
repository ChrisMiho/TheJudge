import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DestinationOutlet } from "./DestinationOutlet";
import type { DestinationId, PortalDestination } from "../../lib/portal/types";

function StatefulField({ label, testId }: { label: string; testId: string }): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <input aria-label={label} data-testid={testId} value={value} onChange={(event) => setValue(event.target.value)} />
  );
}

const DESTINATIONS: PortalDestination[] = [
  { id: "alpha", label: "Alpha", render: () => <StatefulField label="Alpha input" testId="alpha-input" /> },
  { id: "beta", label: "Beta", render: () => <StatefulField label="Beta input" testId="beta-input" /> }
];

function Harness(): JSX.Element {
  const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>("alpha");

  return (
    <div>
      <button type="button" onClick={() => setActiveDestinationId("alpha")}>
        Go alpha
      </button>
      <button type="button" onClick={() => setActiveDestinationId("beta")}>
        Go beta
      </button>
      <DestinationOutlet destinations={DESTINATIONS} activeDestinationId={activeDestinationId} />
    </div>
  );
}

describe("Frontend - Portal", () => {
describe("DestinationOutlet", () => {
  it("mounts only the active destination at startup and lazily mounts others on first activation", () => {
    render(<Harness />);

    expect(screen.getByTestId("alpha-input")).toBeInTheDocument();
    expect(screen.queryByTestId("beta-input")).not.toBeInTheDocument();
  });

  it("hides inactive destinations via the hidden attribute rather than unmounting them", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Go beta" }));

    expect(screen.getByTestId("alpha-input").closest("[hidden]")).not.toBeNull();
    expect(screen.getByTestId("beta-input").closest("[hidden]")).toBeNull();
  });

  it("preserves in-session state when switching between mounted destinations", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByTestId("alpha-input"), "hello");
    await user.click(screen.getByRole("button", { name: "Go beta" }));
    await user.type(screen.getByTestId("beta-input"), "world");
    await user.click(screen.getByRole("button", { name: "Go alpha" }));

    expect(screen.getByTestId("alpha-input")).toHaveValue("hello");

    await user.click(screen.getByRole("button", { name: "Go beta" }));

    expect(screen.getByTestId("beta-input")).toHaveValue("world");
  });

  it("treats selecting the already-active destination as a no-op that does not reset state", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByTestId("alpha-input"), "keep-me");
    await user.click(screen.getByRole("button", { name: "Go alpha" }));

    expect(screen.getByTestId("alpha-input")).toHaveValue("keep-me");
    expect(screen.queryByTestId("beta-input")).not.toBeInTheDocument();
  });
});
});
