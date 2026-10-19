import { useRef, useState } from "react";
import { BrowserRouter } from "react-router";
import { FeedbackModal } from "./components/feedback/FeedbackModal";
import { DestinationOutlet } from "./components/portal/DestinationOutlet";
import { FeaturePortalMenu } from "./components/portal/FeaturePortalMenu";
import { PORTAL_DESTINATIONS } from "./components/portal/destinationRegistry";
import type { PortalDestination } from "./lib/portal/types";
import { useActiveDestination } from "./hooks/useActiveDestination";
import { useThemePalette } from "./hooks/useThemePalette";
import { feedbackFormspreeId, isMockProvider } from "./lib/env";
import { FeedbackContextProvider } from "./lib/feedback/FeedbackContextProvider";
import { useFeedbackContextReader } from "./lib/feedback/feedbackSeam";
import { loadTrackerState } from "./lib/lifeTracker/persistence";
import { trackerStateToRosterSeed } from "./lib/lifeTracker/seed";
import { BrandTapProvider } from "./lib/portal/BrandTapProvider";
import { InDepthCarryContext } from "./lib/portal/inDepthCarryContext";
import { LeftEdgeDrawerProvider } from "./lib/portal/LeftEdgeDrawerProvider";
import { AssistantSeedProvider } from "./lib/portal/AssistantSeedProvider";
import { useAssistantSeed } from "./lib/portal/seedContext";
import type { DestinationId, PortalActionEntry } from "./lib/portal/types";
import type { CardMetadataItem } from "./types";

/** Selector for the portal's own menu trigger, which stays mounted while the dropdown closes. */
const PORTAL_TRIGGER_SELECTOR = 'button[aria-label="Switch feature"]';

/**
 * REQ-067/REQ-206: the Menu lists one question door. `mtg-assistant` (today's
 * In-Depth Question page) stays registered and routable in `PORTAL_DESTINATIONS`
 * (routing, `DestinationOutlet`) but gets no row of its own here — the
 * "Add in-depth details" carry hand-off is how a player reaches it. `quick-lookup`
 * is relabeled "Ask a Question" for the Menu only; its own page copy and route
 * are untouched by this relabel.
 */
const MENU_DESTINATIONS: PortalDestination[] = PORTAL_DESTINATIONS.filter(
  (destination) => destination.id !== "mtg-assistant"
).map((destination) => (destination.id === "quick-lookup" ? { ...destination, label: "Ask a Question" } : destination));

function PortalShell(): JSX.Element {
  const { paletteId, setPalette, colorlessCustomHex, setColorlessCustom, resetColorlessCustom } =
    useThemePalette();
  const { activeDestinationId, setActiveDestinationId } = useActiveDestination(
    PORTAL_DESTINATIONS.map((destination) => destination.id)
  );
  const { queueSeed, queueLookupCarry } = useAssistantSeed();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // REQ-206: remembers whether the quick-lookup visit now active was entered directly from
  // Life Tracker, so the roster-seed hand-off below can still fire from the one gesture that
  // now reaches `mtg-assistant` (Ask a Question's "Add in-depth details" carry) even though
  // it is no longer a single Menu hop. Recomputed on every Menu-driven transition — a
  // true→Ask-a-Question hop sets it, anything else clears it — so a stale flag never
  // survives an unrelated destination visit in between.
  const arrivedAtQuickLookupFromLifeTrackerRef = useRef(false);

  // Narrowly tied to an explicit "switch to Assistant via the Menu, right now"
  // gesture — never a deep link or browser Back arriving at `mtg-assistant`
  // (both are asserted *not* to seed; see App.player-life-tracker-seed.test.tsx).
  // `mtg-assistant` has no Menu row of its own any more (REQ-067/REQ-206), so a Menu pick never
  // has it as the target. Resuming an In-depth entry from Question History goes through
  // `handleResumeDestination` (REQ-213), not this branch, so it never seeds.
  // `handleCarryToInDepth` below is the live way in.
  function handleDestinationSelect(nextDestinationId: DestinationId): void {
    if (activeDestinationId === "player-life-tracker" && nextDestinationId === "mtg-assistant") {
      const trackerState = loadTrackerState();
      if (trackerState) {
        queueSeed(trackerStateToRosterSeed(trackerState));
      }
    }

    arrivedAtQuickLookupFromLifeTrackerRef.current =
      nextDestinationId === "quick-lookup" && activeDestinationId === "player-life-tracker";

    setActiveDestinationId(nextDestinationId);
  }

  // REQ-085: reopening a saved In-Depth conversation or resuming its Draft from Question
  // History sets the destination without the roster-seed check above — the reopened
  // conversation keeps its own players, even when Life Tracker is where History was opened.
  function handleResumeDestination(nextDestinationId: DestinationId): void {
    arrivedAtQuickLookupFromLifeTrackerRef.current = false;
    setActiveDestinationId(nextDestinationId);
  }

  // REQ-206: Ask a Question's "Add in-depth details" pill — the one live gesture that still
  // reaches `mtg-assistant`. Mirrors handleDestinationSelect's roster-seed check above,
  // narrowly re-tied to this one explicit gesture (same negative tests): a quick-lookup
  // visit entered directly from Life Tracker still carries the roster onward when its
  // cards are carried into In-depth details. Consumed once, same as the seed mailbox itself.
  function handleCarryToInDepth(cards: CardMetadataItem[], question: string): void {
    if (arrivedAtQuickLookupFromLifeTrackerRef.current) {
      const trackerState = loadTrackerState();
      if (trackerState) {
        queueSeed(trackerStateToRosterSeed(trackerState));
      }
    }
    arrivedAtQuickLookupFromLifeTrackerRef.current = false;

    queueLookupCarry({ cards, question });
    setActiveDestinationId("mtg-assistant");
  }

  // DEC-104: an action entry runs a handler and never changes activeDestinationId,
  // so the active destination keeps rendering (and keeps its in-progress state)
  // behind the modal.
  const feedbackActionEntry: PortalActionEntry = {
    kind: "action",
    id: "send-feedback",
    label: "Send feedback",
    onSelect: () => {
      // The "Send feedback" menu item is unmounted by the same commit that mounts
      // the modal, so it cannot itself be the focus-restore target. The portal
      // trigger does stay mounted: moving focus to it *before* the modal opens
      // makes it the element FeedbackModal captures on open and restores on
      // close — covering Escape, the close control, and the backdrop alike with
      // no callback plumbing through the modal's fixed prop signature.
      document.querySelector<HTMLElement>(PORTAL_TRIGGER_SELECTOR)?.focus();
      setIsFeedbackModalOpen(true);
    }
  };

  return (
    <FeedbackContextProvider
      activeDestinationId={activeDestinationId}
      providerMode={isMockProvider ? "mock" : "openai"}
    >
      <FeaturePortalMenu
        entries={[...MENU_DESTINATIONS, feedbackActionEntry]}
        activeDestinationId={activeDestinationId}
        // REQ-067: Ask a Question (`quick-lookup`) reads as current while
        // `in-depth` is open too, since it has no row of its own.
        activeDestinationAliasId={activeDestinationId === "mtg-assistant" ? "quick-lookup" : undefined}
        onSelect={handleDestinationSelect}
        onResume={handleResumeDestination}
        paletteId={paletteId}
        onPaletteSelect={setPalette}
        colorlessCustomHex={colorlessCustomHex}
        onColorlessCustomChange={setColorlessCustom}
        onColorlessReset={resetColorlessCustom}
      >
        <InDepthCarryContext.Provider value={{ goToInDepthDetails: handleCarryToInDepth }}>
          <DestinationOutlet destinations={PORTAL_DESTINATIONS} activeDestinationId={activeDestinationId} />
        </InDepthCarryContext.Provider>
      </FeaturePortalMenu>
      <FeedbackModalHost
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </FeedbackContextProvider>
  );
}

/**
 * Reads the snapshot seam from inside the provider (a hook cannot consume the
 * context its own component supplies) and hands the modal a stable reader.
 */
function FeedbackModalHost({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element | null {
  const getFeedbackContext = useFeedbackContextReader();

  return (
    <FeedbackModal
      isOpen={isOpen}
      onClose={onClose}
      getFeedbackContext={getFeedbackContext}
      formspreeId={feedbackFormspreeId}
    />
  );
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <LeftEdgeDrawerProvider>
        <AssistantSeedProvider>
          <BrandTapProvider>
            <PortalShell />
          </BrandTapProvider>
        </AssistantSeedProvider>
      </LeftEdgeDrawerProvider>
    </BrowserRouter>
  );
}
