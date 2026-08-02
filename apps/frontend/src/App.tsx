import { DestinationOutlet } from "./components/portal/DestinationOutlet";
import { FeaturePortalMenu } from "./components/portal/FeaturePortalMenu";
import { PORTAL_DESTINATIONS } from "./components/portal/destinationRegistry";
import { useActiveDestination } from "./hooks/useActiveDestination";
import { useLayoutDensity } from "./hooks/useLayoutDensity";
import { useThemePalette } from "./hooks/useThemePalette";

export default function App() {
  const { paletteId, setPalette } = useThemePalette();
  const { density, setDensity } = useLayoutDensity();
  const { activeDestinationId, setActiveDestinationId } = useActiveDestination(
    PORTAL_DESTINATIONS.map((destination) => destination.id)
  );

  return (
    <FeaturePortalMenu
      destinations={PORTAL_DESTINATIONS}
      activeDestinationId={activeDestinationId}
      onSelect={setActiveDestinationId}
      paletteId={paletteId}
      onPaletteSelect={setPalette}
      density={density}
      onDensityChange={setDensity}
    >
      <DestinationOutlet destinations={PORTAL_DESTINATIONS} activeDestinationId={activeDestinationId} />
    </FeaturePortalMenu>
  );
}
