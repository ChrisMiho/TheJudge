import { useState } from "react";
import { FeedbackModal } from "./components/feedback/FeedbackModal";
import { DestinationOutlet } from "./components/portal/DestinationOutlet";
import { FeaturePortalMenu } from "./components/portal/FeaturePortalMenu";
import { PORTAL_DESTINATIONS } from "./components/portal/destinationRegistry";
import { useActiveDestination } from "./hooks/useActiveDestination";
import { useThemePalette } from "./hooks/useThemePalette";
import { feedbackFormspreeId, isMockProvider } from "./lib/env";
import {
  FeedbackContextProvider,
  useFeedbackContextReader
} from "./lib/feedback/FeedbackContextProvider";
import { loadTrackerState } from "./lib/lifeTracker/persistence";
import { trackerStateToRosterSeed } from "./lib/lifeTracker/seed";
import { AssistantSeedProvider, useAssistantSeed } from "./lib/portal/seedContext";
import type { DestinationId, PortalActionEntry } from "./lib/portal/types";

/** Selector for the portal's own menu trigger, which stays mounted while the dropdown closes. */
const PORTAL_TRIGGER_SELECTOR = 'button[aria-label="Switch feature"]';

function PortalShell(): JSX.Element {
  const { paletteId, setPalette, colorlessCustomHex, setColorlessCustom, resetColorlessCustom } =
    useThemePalette();
  const { activeDestinationId, setActiveDestinationId } = useActiveDestination(
    PORTAL_DESTINATIONS.map((destination) => destination.id)
  );
  const { queueSeed } = useAssistantSeed();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  function handleDestinationSelect(nextDestinationId: DestinationId): void {
    if (activeDestinationId === "player-life-tracker" && nextDestinationId === "mtg-assistant") {
      const trackerState = loadTrackerState();
      if (trackerState) {
        queueSeed(trackerStateToRosterSeed(trackerState));
      }
    }

    setActiveDestinationId(nextDestinationId);
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
        entries={[...PORTAL_DESTINATIONS, feedbackActionEntry]}
        activeDestinationId={activeDestinationId}
        onSelect={handleDestinationSelect}
        paletteId={paletteId}
        onPaletteSelect={setPalette}
        colorlessCustomHex={colorlessCustomHex}
        onColorlessCustomChange={setColorlessCustom}
        onColorlessReset={resetColorlessCustom}
      >
        <DestinationOutlet destinations={PORTAL_DESTINATIONS} activeDestinationId={activeDestinationId} />
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
    <AssistantSeedProvider>
      <PortalShell />
    </AssistantSeedProvider>
  );
}
