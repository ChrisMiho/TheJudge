import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { lazy, useState } from "react";
import { describe, expect, it } from "vitest";
import { appCss } from "../../test/appTestHelpers";
import { DestinationOutlet } from "./DestinationOutlet";
import type { DestinationId, PortalDestination } from "../../lib/portal/types";

function StatefulField({
  label,
  testId,
  isActive
}: {
  label: string;
  testId: string;
  isActive: boolean;
}): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <input
      aria-label={label}
      data-testid={testId}
      data-active={isActive}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

const DESTINATIONS: PortalDestination[] = [
  {
    id: "alpha",
    path: "/alpha",
    label: "Alpha",
    render: (isActive) => <StatefulField label="Alpha input" testId="alpha-input" isActive={isActive} />
  },
  {
    id: "beta",
    path: "/beta",
    label: "Beta",
    render: (isActive) => <StatefulField label="Beta input" testId="beta-input" isActive={isActive} />
  }
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

  it("passes each retained destination's current active/inactive value on every render", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId("alpha-input")).toHaveAttribute("data-active", "true");

    await user.click(screen.getByRole("button", { name: "Go beta" }));

    expect(screen.getByTestId("alpha-input")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("beta-input")).toHaveAttribute("data-active", "true");

    await user.click(screen.getByRole("button", { name: "Go alpha" }));

    expect(screen.getByTestId("alpha-input")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("beta-input")).toHaveAttribute("data-active", "false");
  });

  it("isolates a first-visit fallback while retaining loaded sibling state and skips it on revisit", async () => {
    const user = userEvent.setup();
    let resolveBeta: (() => void) | undefined;
    const LazyBeta = lazy(
      () =>
        new Promise<{ default: typeof StatefulField }>((resolve) => {
          resolveBeta = () => resolve({ default: StatefulField });
        })
    );
    const destinations: PortalDestination[] = [
      DESTINATIONS[0],
      {
        id: "beta",
        path: "/beta",
        label: "Beta",
        render: (isActive) => <LazyBeta label="Beta input" testId="beta-input" isActive={isActive} />
      }
    ];

    function LazyHarness(): JSX.Element {
      const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>("alpha");
      return (
        <div>
          <button type="button" onClick={() => setActiveDestinationId("alpha")}>Go alpha</button>
          <button type="button" onClick={() => setActiveDestinationId("beta")}>Go beta</button>
          <DestinationOutlet destinations={destinations} activeDestinationId={activeDestinationId} />
        </div>
      );
    }

    render(<LazyHarness />);
    await user.type(screen.getByTestId("alpha-input"), "retained");
    await user.click(screen.getByRole("button", { name: "Go beta" }));

    const fallback = screen.getByRole("status", { name: "Loading destination" });
    expect(fallback).toBeVisible();
    expect(fallback.closest(".page-card")).not.toBeNull();
    expect(screen.getByTestId("alpha-input")).toHaveValue("retained");
    expect(screen.getByTestId("alpha-input").closest("[hidden]")).not.toBeNull();

    await act(async () => resolveBeta?.());

    expect(screen.queryByRole("status", { name: "Loading destination" })).not.toBeInTheDocument();
    expect(screen.getByTestId("beta-input")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Go alpha" }));
    await user.click(screen.getByRole("button", { name: "Go beta" }));

    expect(screen.queryByRole("status", { name: "Loading destination" })).not.toBeInTheDocument();
    expect(screen.getByTestId("alpha-input")).toHaveValue("retained");
  });

  it("reserves the fallback region with the existing panel-spacing token", () => {
    expect(appCss).toMatch(
      /\.destination-load-fallback\s*\{[^}]*min-height:\s*calc\([^)]*var\(--layout-panel-padding\)[^)]*\)/s
    );
  });
});
});
