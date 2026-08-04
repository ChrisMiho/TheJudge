import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeaturePortalMenu } from "./FeaturePortalMenu";
import { ConversationHistoryDrawer } from "../ConversationHistoryDrawer";
import { LeftEdgeDrawerProvider } from "../../lib/portal/leftEdgeDrawerContext";
import type { DestinationId, PortalEntry } from "../../lib/portal/types";
import { appCss, jsonResponse, getUrlFromRequest } from "../../test/appTestHelpers";

const DESTINATIONS: PortalEntry[] = [
  { kind: "destination", id: "mtg-assistant", label: "MTG Assistant", render: () => <div /> },
  { kind: "destination", id: "trade-balancer", label: "Trade", render: () => <div /> }
];

interface HarnessProps {
  initialId?: DestinationId;
  initialPaletteId?: string;
  onPaletteSelect?: (id: string) => void;
  entries?: PortalEntry[];
  onSelect?: (id: DestinationId) => void;
}

function Harness({
  initialId = "mtg-assistant",
  initialPaletteId = "blue",
  onPaletteSelect = vi.fn(),
  entries = DESTINATIONS,
  onSelect
}: HarnessProps): JSX.Element {
  const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>(initialId);
  const [paletteId, setPaletteId] = useState(initialPaletteId);
  const [colorlessCustomHex, setColorlessCustomHex] = useState<string | undefined>(undefined);
  return (
    <FeaturePortalMenu
      entries={entries}
      activeDestinationId={activeDestinationId}
      onSelect={(id) => {
        onSelect?.(id);
        setActiveDestinationId(id);
      }}
      paletteId={paletteId}
      onPaletteSelect={(id) => {
        setPaletteId(id);
        onPaletteSelect(id);
      }}
      colorlessCustomHex={colorlessCustomHex}
      onColorlessCustomChange={setColorlessCustomHex}
      onColorlessReset={() => setColorlessCustomHex(undefined)}
    >
      <div>content</div>
    </FeaturePortalMenu>
  );
}

describe("Frontend - Portal", () => {
describe("FeaturePortalMenu", () => {
  it("renders a labelled, closed button with aria-haspopup", () => {
    render(<Harness />);

    const button = screen.getByRole("button", { name: "Switch feature" });
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveTextContent("☰");
    expect(button).not.toHaveTextContent("Menu");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the menu and lists both destinations with the active one marked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    expect(screen.getByRole("button", { name: "Switch feature" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("menuitem", { name: "Trade" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme: Blue" })).toBeInTheDocument();
  });

  it("selects a palette and keeps the menu open", async () => {
    const user = userEvent.setup();
    const onPaletteSelect = vi.fn();
    render(<Harness onPaletteSelect={onPaletteSelect} />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: Green" }));

    expect(onPaletteSelect).toHaveBeenCalledWith("green");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("exposes Colorless inline controls immediately after selecting Colorless", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Theme: Colorless" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByLabelText("Customize Colorless color")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset to gray" })).toBeInTheDocument();
  });

  it("changes and resets the Colorless custom color inline without closing the menu", async () => {
    const user = userEvent.setup();
    const onColorlessCustomChange = vi.fn();
    const onColorlessReset = vi.fn();
    render(
      <FeaturePortalMenu
        entries={DESTINATIONS}
        activeDestinationId="mtg-assistant"
        onSelect={vi.fn()}
        paletteId="colorless"
        onPaletteSelect={vi.fn()}
        colorlessCustomHex={undefined}
        onColorlessCustomChange={onColorlessCustomChange}
        onColorlessReset={onColorlessReset}
      >
        <div>content</div>
      </FeaturePortalMenu>
    );

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    fireEvent.change(screen.getByLabelText("Customize Colorless color"), {
      target: { value: "#123456" }
    });
    expect(onColorlessCustomChange).toHaveBeenCalledWith("#123456");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset to gray" }));
    expect(onColorlessReset).toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("keeps the menu Theme section palette-only", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    expect(screen.queryByText("Layout")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Layout:/ })).not.toBeInTheDocument();
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

  it("renders action entries alongside destinations in array order", async () => {
    const user = userEvent.setup();
    const entries: PortalEntry[] = [...DESTINATIONS, { kind: "action", id: "demo-action", label: "Demo action", onSelect: vi.fn() }];
    render(<Harness entries={entries} />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
    expect(items).toEqual(["MTG Assistant✓", "Trade", "Demo action"]);
    expect(screen.getByRole("menuitem", { name: "Demo action" })).not.toHaveAttribute("aria-current");
  });

  it("runs an action entry's own handler, closes the menu, and leaves the active destination unchanged", async () => {
    const user = userEvent.setup();
    const actionSelect = vi.fn();
    const onSelect = vi.fn();
    const entries: PortalEntry[] = [...DESTINATIONS, { kind: "action", id: "demo-action", label: "Demo action", onSelect: actionSelect }];
    render(<Harness entries={entries} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Demo action" }));

    expect(actionSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
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

describe("Chrome integration", () => {
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

    const user = userEvent.setup();
    await user.click(portalButton);
    expect(screen.getByRole("menuitem", { name: "In-Depth Question" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Theme: / }).length).toBeGreaterThan(0);
    expect(portalButton).not.toHaveTextContent("Menu");
  });

  it("switches to Quick Question and back via the portal menu", async () => {
    const user = userEvent.setup();
    const { default: App } = await import("../../App");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Quick Question" }));

    expect(screen.getByLabelText("Card search")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "In-Depth Question" }));

    expect(screen.getByLabelText("Card search")).not.toBeVisible();
  });

  it("keeps the portal button docked in-flow after flipping between destinations and back", async () => {
    const user = userEvent.setup();
    const { default: App } = await import("../../App");
    render(<App />);

    // Both destinations stay mounted (hidden, not unmounted) once visited, so their
    // <PortalSlot /> headers only register once on first mount. Flipping back to a
    // previously-visited destination must not leave the button pointed at a slot that's
    // now hidden inside the other, inactive destination. Re-query the button fresh after
    // each switch since portaling into a new container can replace the DOM node.
    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Quick Question" }));
    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "In-Depth Question" }));

    const portalButton = screen.getByRole("button", { name: "Switch feature" });
    const portalContainerClassName = portalButton.closest("div")?.className ?? "";
    expect(portalContainerClassName).toContain("portal-slot-tab");
    expect(portalContainerClassName).not.toContain("fixed");
  });

  it("closes an open history drawer when the Menu opens, and vice versa, via the shared left-edge signal", async () => {
    const user = userEvent.setup();

    function TwoDrawerHarness(): JSX.Element {
      const [isHistoryOpen, setIsHistoryOpen] = useState(false);
      return (
        <LeftEdgeDrawerProvider>
          <Harness />
          <button type="button" onClick={() => setIsHistoryOpen(true)}>
            Open history
          </button>
          <ConversationHistoryDrawer
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            entries={[]}
            onSelectEntry={vi.fn()}
          />
        </LeftEdgeDrawerProvider>
      );
    }

    render(<TwoDrawerHarness />);

    await user.click(screen.getByRole("button", { name: "Open history" }));
    expect(screen.getByRole("dialog", { name: "Conversation history" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Conversation history" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open history" }));
    expect(screen.getByRole("dialog", { name: "Conversation history" })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
});
