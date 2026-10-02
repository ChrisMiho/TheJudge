import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AdaptiveContextDialog } from "./AdaptiveContextDialog";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { ConversationThread } from "./ConversationThread";
import { FrozenGameContextDetails } from "./FrozenGameContextDetails";
import type { CardMetadataItem, ConversationMessage, GameContext } from "../types";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

const cardWithoutImage: CardMetadataItem = {
  cardId: "opt",
  name: "Opt",
  imageId: "",
  colors: ["U"],
};

const messages: ConversationMessage[] = [
  { role: "assistant", content: "The stack resolves." },
  { role: "user", content: "What about hexproof?" }
];

const frozenContext: GameContext = {
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 20 },
    { label: "Player 2", lifeTotal: 20 }
  ],
  turnPhase: "combat",
  combatStep: "declare_blockers",
  activePlayer: "Player 1",
  selectedZones: ["stack"],
  zones: {
    stack: [{ cardId: "opt", name: "Opt", oracleText: "Scry 1, then draw a card." }]
  }
};

describe("Frontend - Responsive surface hooks", () => {
  it("defines one fluid spacing vocabulary and consumes it on shared shells", () => {
    expect(appCss).toMatch(/--layout-page-padding-inline:\s*clamp\([^;]+\);/);
    expect(appCss).toMatch(/--layout-page-padding-block:\s*clamp\([^;]+\);/);
    expect(appCss).toMatch(/--layout-panel-padding:\s*clamp\([^;]+\);/);
    expect(appCss).toMatch(/--layout-content-padding:\s*clamp\([^;]+\);/);
    expect(appCss).toMatch(/--layout-surface-gap:\s*clamp\([^;]+\);/);
    expect(appCss).toMatch(/--layout-compact-gap:\s*clamp\([^;]+\);/);
    // REQ-207: the shell has no page padding of its own, so the header sits at the top edge.
    expect(appCss).toMatch(/\.page-shell \{[^}]*min-height: 100dvh/s);
    expect(appCss).not.toMatch(/\.page-shell \{[^}]*padding/s);
    // Look-matching pass (slice L): `.page-content` replaces `.page-card` (no more
    // bordered card frame) but keeps the same spacing vocabulary.
    expect(appCss).toMatch(/\.page-content \{[^}]*gap:\s*var\(--layout-surface-gap\)/s);
    expect(appCss).toMatch(/\.panel-inner \{[^}]*var\(--layout-content-padding\)/s);
  });

  it("uses automatic mobile-first rules with no density selector", () => {
    expect(appCss).not.toContain("data-layout-density");
    // Look-matching pass (slice L): the mock-mode banner moved into normal flow
    // (under `.app-header`) and no longer needs a measured-height shell offset —
    // `.page-shell[data-mock-banner="true"]`/`--mock-banner-height` (REQ-123) retire
    // with the fixed positioning that required them.
    expect(appCss).not.toContain('[data-mock-banner="true"]');
    expect(appCss).not.toContain("--mock-banner-height");
    expect(appCss).toMatch(/\.portal-slot-tab \{[^}]*margin:\s*0/s);
    expect(appCss).toMatch(/\.step-eyebrow \{[^}]*clamp\(/s);
  });

  it("covers staged, card, scan, conversation, and adaptive-context surfaces", () => {
    for (const selector of [
      ".zone-card-grid",
      ".zone-card-tile",
      ".scroll-cap-4-enrichment",
      ".enrichment-card-row",
      ".scan-video",
      ".conversation-workspace",
      ".adaptive-context-surface"
    ]) {
      expect(appCss).toContain(`${selector} {`);
    }

    // Horizontal left-to-right strip with its own region scroll (DEC-151 part 3, REQ-130):
    // `overflow-x-auto`/`flex` are applied via Tailwind classes in ZoneCardPicker's JSX, so
    // the shared `.zone-card-grid` CSS block now only carries the gap token — the prior
    // vertical-scroll `max-height: 70dvh` cap is gone.
    expect(appCss).toMatch(/\.zone-card-grid \{[^}]*--zone-card-grid-gap/s);
    expect(appCss).not.toMatch(/\.zone-card-grid \{[^}]*max-height:\s*70dvh/s);
    expect(appCss).not.toContain("--zone-card-tile-height");
    expect(appCss).not.toContain("--enrichment-card-row-height");
  });

  it("keeps semantic hooks on responsive card and conversation content", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CardSelectionPreview card={cardWithoutImage} />
    );
    // No image available: CardPresentation's shared text-first fallback renders directly
    // (DEC-78/DEC-151) rather than a dedicated empty "No image" placeholder box.
    expect(screen.getByTestId("card-presentation-fallback")).toBeInTheDocument();
    expect(screen.getAllByText("Opt").length).toBeGreaterThan(0);

    rerender(<ConversationThread messages={messages} />);
    expect(screen.getByText("The stack resolves.").closest(".thread")).not.toBeNull();

    rerender(
      <AdaptiveContextDialog
        triggerLabel="Combat · 1 populated zone"
        dialogLabel="Frozen game context"
      >
        <FrozenGameContextDetails frozenGameContext={frozenContext} />
      </AdaptiveContextDialog>
    );
    await user.click(screen.getByRole("button", { name: /View context:/ }));
    expect(screen.getByRole("dialog", { name: "Frozen game context" })).toHaveClass(
      "adaptive-context-surface"
    );
    expect(screen.getAllByText("Opt").at(-1)?.closest("li")).toHaveClass("frozen-context-detail-row");
  });
});
