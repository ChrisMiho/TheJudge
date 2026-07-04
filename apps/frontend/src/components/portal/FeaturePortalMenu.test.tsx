import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeaturePortalMenu } from "./FeaturePortalMenu";
import type { DestinationId, PortalDestination } from "../../lib/portal/types";
import { appCss, jsonResponse, getUrlFromRequest } from "../../test/appTestHelpers";

const DESTINATIONS: PortalDestination[] = [
  { id: "mtg-assistant", label: "MTG Assistant", render: () => <div /> },
  { id: "trade-balancer", label: "Trade", render: () => <div /> }
];

function Harness({ initialId = "mtg-assistant" }: { initialId?: DestinationId }): JSX.Element {
  const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>(initialId);
  return (
    <FeaturePortalMenu destinations={DESTINATIONS} activeDestinationId={activeDestinationId} onSelect={setActiveDestinationId}>
      <div>content</div>
    </FeaturePortalMenu>
  );
}

describe("FeaturePortalMenu", () => {
  it("renders a labelled, closed button with aria-haspopup", () => {
    render(<Harness />);

    const button = screen.getByRole("button", { name: "Switch feature" });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the menu and lists both destinations with the active one marked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    expect(screen.getByRole("button", { name: "Switch feature" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("menuitem", { name: "Trade" })).not.toHaveAttribute("aria-current");
  });

  it("switches the active destination and closes the menu when a non-active item is selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Trade" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menuitem", { name: "Trade" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).not.toHaveAttribute("aria-current");
  });

  it("treats selecting the already-active destination as a no-op and still closes the menu", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "MTG Assistant" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).toHaveAttribute("aria-current", "true");
  });

  it("closes the menu on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Harness />
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("is positioned top-middle, distinct from right-corner chrome", () => {
    render(<Harness />);

    const container = screen.getByRole("button", { name: "Switch feature" }).closest("div");
    expect(container?.className).toContain("left-1/2");
    expect(container?.className).toContain("-translate-x-1/2");
    expect(container?.className).toContain("top-0");
    expect(container?.className).not.toContain("right-3");
  });
});

describe("FeaturePortalMenu reduced motion", () => {
  it("covers the portal menu open animation in the prefers-reduced-motion block", () => {
    const reducedMotionBlock = appCss.slice(appCss.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotionBlock).toContain(".portal-menu-motion");
  });
});

describe("Slice B: portal chrome integration", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = getUrlFromRequest(input);
      if (url === "/data/cardMetadata.json") {
        return jsonResponse([]);
      }
      return jsonResponse({ error: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the portal button inline in the staged step header, between the brand and the step name", async () => {
    const { default: App } = await import("../../App");
    render(<App />);

    const brand = screen.getByRole("button", { name: "TheJudge" });
    const portalButton = screen.getByRole("button", { name: "Switch feature" });
    const stepHeading = screen.getByRole("heading", { name: "Game context" });
    const themeButton = screen.getByRole("button", { name: "Theme" });

    expect(brand).toBeInTheDocument();
    // A header slot is available (StagedStepHeader renders <PortalSlot />), so the button
    // renders in normal flow inside the header grid, then lifts via `.portal-slot-tab`'s
    // negative margin to meet .page-card's own top border (see index.css) — rather than
    // falling back to the viewport-fixed floating tab.
    const portalContainerClassName = portalButton.closest("div")?.className ?? "";
    expect(portalContainerClassName).toContain("portal-slot-tab");
    expect(portalContainerClassName).not.toContain("fixed");
    expect(brand.compareDocumentPosition(portalButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(portalButton.compareDocumentPosition(stepHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(themeButton.closest("div")?.parentElement?.className).toContain("right-3");
  });

  it("falls back to the fixed floating tab on the Trade destination, which has no header slot", async () => {
    const user = userEvent.setup();
    const { default: App } = await import("../../App");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Trade" }));

    const portalButton = screen.getByRole("button", { name: "Switch feature" });
    expect(portalButton.closest("div")?.className).toContain("fixed");
    expect(portalButton.closest("div")?.className).toContain("left-1/2");
  });

  it("switches to the Trade placeholder and back via the portal menu", async () => {
    const user = userEvent.setup();
    const { default: App } = await import("../../App");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Trade" }));

    expect(screen.getByText("Trade — coming soon")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "MTG Assistant" }));

    expect(screen.getByText("Trade — coming soon")).not.toBeVisible();
  });
});
