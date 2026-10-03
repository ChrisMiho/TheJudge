import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeaturePortalMenu } from "./FeaturePortalMenu";
import { PortalSlot } from "./PortalSlot";
import { LeftEdgeDrawerProvider } from "../../lib/portal/leftEdgeDrawerContext";
import type { DestinationId, PortalEntry } from "../../lib/portal/types";
import { navigateToPath, startOnInDepthQuestion } from "../../test/appTestHelpers";
import { appCss, jsonResponse, getUrlFromRequest } from "../../test/appTestHelpers";

const DESTINATIONS: PortalEntry[] = [
  {
    kind: "destination",
    id: "mtg-assistant",
    label: "MTG Assistant",
    path: "/in-depth",
    render: () => <div />
  },
  {
    kind: "destination",
    id: "trade-balancer",
    label: "Trade",
    path: "/trade-balancer",
    render: () => <div />
  }
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

    // DEC-150: once open, the trigger itself is gone from the DOM (not merely hidden) —
    // see the dedicated "rail-hide while open" describe block below for full coverage.
    expect(screen.queryByRole("button", { name: "Switch feature" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).toHaveAttribute("aria-current", "page");
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
    expect(screen.getByRole("menuitem", { name: "Trade" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).not.toHaveAttribute("aria-current");
  });

  it("treats selecting the already-active destination as a no-op and still closes the menu", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "MTG Assistant" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).toHaveAttribute("aria-current", "page");
  });

  it("renders action entries alongside destinations in array order", async () => {
    const user = userEvent.setup();
    const entries: PortalEntry[] = [...DESTINATIONS, { kind: "action", id: "demo-action", label: "Demo action", onSelect: vi.fn() }];
    render(<Harness entries={entries} />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
    // REQ-067: a "Question History" row is always fixed right after the first entry,
    // regardless of what entries the caller passes — see the dedicated describe block
    // below for its own behaviour.
    expect(items).toEqual(["MTG Assistant✓", "◷Question History", "⚖Trade", "✎Demo action"]);
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
    expect(screen.getByRole("menuitem", { name: "MTG Assistant" })).toHaveAttribute("aria-current", "page");
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

  it("sits at the top-left as the header's ☰ toggle, a plain text glyph in the mockup's own button", () => {
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Switch feature" });
    expect(trigger).toHaveClass("menu-toggle");
    expect(trigger).toHaveTextContent("☰");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
  });

});

describe("FeaturePortalMenu single rail trigger (REQ-114/REQ-115/REQ-207)", () => {
  // REQ-114/REQ-115/REQ-116/REQ-207: the split Menu+History rail (DEC-126) is retired —
  // there is one ☰ trigger at every width, on every destination, whether or not the
  // visible slot has a history trigger. History access moves into the drawer's own
  // "Question History" row (REQ-067), covered in its own describe block below.
  function SlotHarness({ historyOnOpen }: { historyOnOpen?: () => void }): JSX.Element {
    const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>("mtg-assistant");
    return (
      <FeaturePortalMenu
        entries={DESTINATIONS}
        activeDestinationId={activeDestinationId}
        onSelect={setActiveDestinationId}
        paletteId="blue"
        onPaletteSelect={vi.fn()}
        colorlessCustomHex={undefined}
        onColorlessCustomChange={vi.fn()}
        onColorlessReset={vi.fn()}
      >
        <PortalSlot historyTrigger={historyOnOpen ? { onOpen: historyOnOpen } : undefined} />
        <div>content</div>
      </FeaturePortalMenu>
    );
  }

  it("renders a single Menu-only trigger whether or not the visible slot has a history trigger", () => {
    render(<SlotHarness />);
    expect(screen.getByRole("button", { name: "Switch feature" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Conversation history" })).not.toBeInTheDocument();
  });

  it("still renders a single Menu-only trigger when the visible slot does have a history trigger", () => {
    render(<SlotHarness historyOnOpen={vi.fn()} />);
    const menuButton = screen.getByRole("button", { name: "Switch feature" });
    expect(menuButton).toHaveClass("menu-toggle");
    expect(screen.queryByRole("button", { name: "Conversation history" })).not.toBeInTheDocument();
  });
});

describe("FeaturePortalMenu Question History row (REQ-067)", () => {
  function SlotHarness({ historyOnOpen }: { historyOnOpen?: () => void }): JSX.Element {
    const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>("mtg-assistant");
    return (
      <FeaturePortalMenu
        entries={DESTINATIONS}
        activeDestinationId={activeDestinationId}
        onSelect={setActiveDestinationId}
        paletteId="blue"
        onPaletteSelect={vi.fn()}
        colorlessCustomHex={undefined}
        onColorlessCustomChange={vi.fn()}
        onColorlessReset={vi.fn()}
      >
        <PortalSlot historyTrigger={historyOnOpen ? { onOpen: historyOnOpen } : undefined} />
        <div>content</div>
      </FeaturePortalMenu>
    );
  }

  it("sits right after the first entry, ahead of every later entry", async () => {
    const user = userEvent.setup();
    render(<SlotHarness historyOnOpen={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const items = screen.getAllByRole("menuitem").map((item) => item.getAttribute("aria-label"));
    expect(items).toEqual(["MTG Assistant", "Question History", "Trade"]);
  });

  it("opens the combined Question History sheet and closes the Menu, without changing the active destination (REQ-213)", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <FeaturePortalMenu
        entries={DESTINATIONS}
        activeDestinationId="mtg-assistant"
        onSelect={onSelect}
        paletteId="blue"
        onPaletteSelect={vi.fn()}
        colorlessCustomHex={undefined}
        onColorlessCustomChange={vi.fn()}
        onColorlessReset={vi.fn()}
      >
        <div>content</div>
      </FeaturePortalMenu>
    );

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Question History" }));

    expect(screen.getByRole("dialog", { name: /Question History/ })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("is always enabled, regardless of whether the visible slot has a history trigger of its own (REQ-103/REQ-107)", async () => {
    const user = userEvent.setup();
    render(<SlotHarness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const row = screen.getByRole("menuitem", { name: "Question History" });
    expect(row).not.toBeDisabled();

    await user.click(row);
    expect(screen.getByRole("dialog", { name: /Question History/ })).toBeInTheDocument();
  });
});

describe("FeaturePortalMenu rail-hide while open (DEC-150)", () => {
  // DEC-150 amends DEC-140's "trigger stays interactive so the user can close it" clause:
  // while the tray is open, neither the Menu trigger nor (on History-bearing destinations)
  // the History zone may be visible or hit-testable. The rail stays mounted (same DOM node
  // identity — see the `.portal-menu-rail-inert` comment in FeaturePortalMenu.tsx for why:
  // other chrome, e.g. the feedback modal opened via this same Menu, restores focus to "the
  // portal trigger" by DOM reference across the open/close cycle) and is instead made
  // paint- and hit-test-inert via `visibility: hidden` / `pointer-events: none` plus
  // `aria-hidden`/`tabIndex={-1}`. Real hit-testing (`elementFromPoint`) is verified via
  // Playwright at the browser level; these tests assert the DOM-level contract the component
  // controls directly.
  function SlotHarness({ historyOnOpen }: { historyOnOpen?: () => void }): JSX.Element {
    const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>("mtg-assistant");
    return (
      <FeaturePortalMenu
        entries={DESTINATIONS}
        activeDestinationId={activeDestinationId}
        onSelect={setActiveDestinationId}
        paletteId="blue"
        onPaletteSelect={vi.fn()}
        colorlessCustomHex={undefined}
        onColorlessCustomChange={vi.fn()}
        onColorlessReset={vi.fn()}
      >
        <PortalSlot historyTrigger={historyOnOpen ? { onOpen: historyOnOpen } : undefined} />
        <div>content</div>
      </FeaturePortalMenu>
    );
  }

  it("makes the Menu-only trigger inert (hidden, non-hit-testable, out of tab order, no-op onClick) while the tray is open, and restores it on close", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Switch feature" });
    expect(trigger).not.toHaveAttribute("aria-hidden");
    expect(trigger).not.toHaveAttribute("tabindex");
    expect(trigger).not.toHaveAttribute("aria-hidden");

    await user.click(trigger);

    // Same DOM node throughout — not unmounted/remounted. `document.body.contains` (rather
    // than a fresh `getByRole` query, which excludes `aria-hidden` elements by default)
    // confirms the reference captured before opening is still attached, which is what keeps
    // unrelated chrome (e.g. the feedback modal's focus-restore) working across the
    // open/close cycle.
    expect(document.body.contains(trigger)).toBe(true);
    expect(trigger).toHaveAttribute("aria-hidden", "true");
    expect(trigger).toHaveAttribute("tabindex", "-1");
    expect(trigger).toHaveAttribute("aria-hidden", "true");

    // Belt-and-suspenders: even a direct click while inert must not toggle the tray again.
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(trigger).not.toHaveAttribute("aria-hidden");
    expect(trigger).not.toHaveAttribute("tabindex");
    expect(trigger).not.toHaveAttribute("aria-hidden");
  });

  it("makes the single Menu trigger inert while the tray is open even when the visible slot has a history trigger, and restores it on close", async () => {
    const user = userEvent.setup();
    const historyOnOpen = vi.fn();
    render(<SlotHarness historyOnOpen={historyOnOpen} />);

    const menuButton = screen.getByRole("button", { name: "Switch feature" });

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-hidden", "true");
    expect(menuButton).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // The Question History row (not a second rail zone) is how history opens while the
    // tray is open — covered in its own describe block.
    await user.keyboard("{Escape}");

    expect(menuButton).not.toHaveAttribute("aria-hidden");
  });

  it("restores the trigger (same node) after an outside click closes the tray (only outside-click/Escape close it now)", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Harness />
        <button type="button">Outside</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Switch feature" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-hidden", "true");

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("button", { name: "Switch feature" })).toBe(trigger);
  });

  it("keeps the inert trigger both paint- and hit-test-inert, not merely non-interactive", () => {
    expect(appCss).toMatch(/\.menu-toggle\[aria-hidden="true"\] \{[^}]*visibility: hidden;[^}]*pointer-events: none/);
  });
});

describe("FeaturePortalMenu reduced motion", () => {
  it("lets the tray and its backdrop appear in place under prefers-reduced-motion", () => {
    expect(appCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^}]*\.menu-tray,[^}]*\.menu-tray-backdrop[^}]*transition: none/);
  });
});

describe("FeaturePortalMenu tray (the mockup's .menu-tray, REQ-122)", () => {
  it("portals the open tray to the document body, a fixed full-height left tray with its own backdrop", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("menu-tray");
    expect(container.contains(menu)).toBe(false);
    expect(menu.closest(".menu-tray-host")?.parentElement).toBe(document.body);
    expect(document.querySelector(".menu-tray-backdrop")).not.toBeNull();
  });

  it("slides in once mounted: the host flips data-tray-open from false to true", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const host = document.querySelector(".menu-tray-host") as HTMLElement;
    await waitFor(() => expect(host).toHaveAttribute("data-tray-open", "true"));
  });

  it("is opaque over the page (REQ-122): a solid ground sits under the glass gradients", () => {
    expect(appCss).toMatch(/\.menu-tray \{[^}]*background-color: var\(--surface-ground\)/);
  });

  it("lays out the tray in the mockup's order: brand and ✕, the destination list, the Theme band, then the flair", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));

    const menu = screen.getByRole("menu");
    const order = Array.from(menu.children).map((child) => child.className || child.tagName.toLowerCase());
    expect(order).toEqual(["tray-brand", "tray-nav-list", "h3", "theme-band", "theme-custom", "tray-flair"]);
    expect(within(menu).getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(menu.querySelector(".tray-brand .brand-mark")).not.toBeNull();
  });

  it("closes from the tray's own ✕", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on a click on the backdrop", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(document.querySelector(".menu-tray-backdrop") as HTMLElement);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not close when clicking inside the tray itself", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("group", { name: "Theme palettes" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
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

  it("renders the portal button inline in the staged step header, ahead of the centered brand and the step eyebrow", async () => {
    // This case is about In-Depth Question's staged header specifically; Quick Question is
    // the portal's default destination, so say which screen is under test.
    startOnInDepthQuestion();
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
    // REQ-114/115: the split Menu+History rail is retired — one ☰ trigger at every
    // width, on every destination, whether or not the visible slot has a history
    // trigger. The button's immediate parent is `.portal-slot-tab` directly.
    const portalContainerClassName = portalButton.closest(".portal-slot-tab")?.className ?? "";
    expect(portalContainerClassName).toContain("portal-slot-tab");
    expect(portalContainerClassName).not.toContain("fixed");
    // Header grid: PortalSlot (left column) precedes the centered brand block; the
    // step-name eyebrow now renders outside the header, above the step's own content.
    expect(portalButton.compareDocumentPosition(brand) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(brand.compareDocumentPosition(stepHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const user = userEvent.setup();
    await user.click(portalButton);
    // REQ-067: `in-depth` has no row of its own; "Ask a Question" reads current instead.
    expect(screen.getByRole("menuitem", { name: "Ask a Question" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("menuitem", { name: "In-Depth Question" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Theme: / }).length).toBeGreaterThan(0);
    expect(portalButton).not.toHaveTextContent("Menu");
  });

  it("switches to Ask a Question and back to In-depth details via the portal menu / direct navigation", async () => {
    const user = userEvent.setup();
    startOnInDepthQuestion();
    const { default: App } = await import("../../App");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Ask a Question" }));

    // Look-matching pass (slice M): the card search opens from "＋ Add card"
    // (requirement 1) instead of sitting permanently visible.
    await user.click(screen.getByRole("button", { name: "Add card" }));
    expect(screen.getByLabelText("Card search")).toBeInTheDocument();

    // REQ-067/REQ-206: `in-depth` stays registered and routable with no row of its own —
    // reached by direct navigation (slice C's "Add in-depth details" carry, once built).
    await navigateToPath("/in-depth");

    await waitFor(() => expect(screen.getByLabelText("Card search")).not.toBeVisible());
  });

  it("keeps the portal button docked in-flow after flipping between destinations and back", async () => {
    const user = userEvent.setup();
    startOnInDepthQuestion();
    const { default: App } = await import("../../App");
    render(<App />);

    // Both destinations stay mounted (hidden, not unmounted) once visited, so their
    // <PortalSlot /> headers only register once on first mount. Flipping back to a
    // previously-visited destination must not leave the button pointed at a slot that's
    // now hidden inside the other, inactive destination. Re-query the button fresh after
    // each switch since portaling into a new container can replace the DOM node.
    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Ask a Question" }));
    await navigateToPath("/in-depth");

    const portalButton = await screen.findByRole("button", { name: "Switch feature" });
    // Same two-zone-wrapper caveat as above: climb to the nearest `.portal-slot-tab`
    // ancestor rather than the immediate parent div.
    const portalContainerClassName = portalButton.closest(".portal-slot-tab")?.className ?? "";
    expect(portalContainerClassName).toContain("portal-slot-tab");
    expect(portalContainerClassName).not.toContain("fixed");
  });

  it("closes the Question History sheet when the Menu opens, and vice versa, via the shared left-edge signal", async () => {
    // REQ-213: the combined-list sheet is now FeaturePortalMenu's own, opened from its
    // "Question History" row — no separate standalone drawer to coordinate.
    const user = userEvent.setup();

    render(
      <LeftEdgeDrawerProvider>
        <Harness />
      </LeftEdgeDrawerProvider>
    );

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    await user.click(screen.getByRole("menuitem", { name: "Question History" }));
    expect(screen.getByRole("dialog", { name: /Question History/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch feature" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /Question History/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Question History" }));
    expect(screen.getByRole("dialog", { name: /Question History/ })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
});
