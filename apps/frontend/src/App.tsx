import { DestinationOutlet } from "./components/portal/DestinationOutlet";
import { FeaturePortalMenu } from "./components/portal/FeaturePortalMenu";
import { PORTAL_DESTINATIONS } from "./components/portal/destinationRegistry";
import { useActiveDestination } from "./hooks/useActiveDestination";
import { useThemePalette } from "./hooks/useThemePalette";
import { loadTrackerState } from "./lib/lifeTracker/persistence";
import { trackerStateToRosterSeed } from "./lib/lifeTracker/seed";
import { AssistantSeedProvider, useAssistantSeed } from "./lib/portal/seedContext";
import type { DestinationId } from "./lib/portal/types";

function PortalShell(): JSX.Element {
  const { paletteId, setPalette, colorlessCustomHex, setColorlessCustom, resetColorlessCustom } =
    useThemePalette();
  const { activeDestinationId, setActiveDestinationId } = useActiveDestination(
    PORTAL_DESTINATIONS.map((destination) => destination.id)
  );
  const { queueSeed } = useAssistantSeed();

  function handleDestinationSelect(nextDestinationId: DestinationId): void {
    if (activeDestinationId === "player-life-tracker" && nextDestinationId === "mtg-assistant") {
      const trackerState = loadTrackerState();
      if (trackerState) {
        queueSeed(trackerStateToRosterSeed(trackerState));
      }
    }

    setActiveDestinationId(nextDestinationId);
  }

  return (
    <FeaturePortalMenu
      destinations={PORTAL_DESTINATIONS}
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
  );
}

export default function App(): JSX.Element {
  return (
    <AssistantSeedProvider>
      <PortalShell />
    </AssistantSeedProvider>
  );
}
