import { useState } from "react";
import { ThemeControl } from "./components/ThemeControl";
import { DestinationOutlet } from "./components/portal/DestinationOutlet";
import { FeaturePortalMenu } from "./components/portal/FeaturePortalMenu";
import { PORTAL_DESTINATIONS } from "./components/portal/destinationRegistry";
import { useLayoutDensity } from "./hooks/useLayoutDensity";
import { useThemePalette } from "./hooks/useThemePalette";
import type { DestinationId } from "./lib/portal/types";

export default function App() {
  const { paletteId, setPalette } = useThemePalette();
  const { density, setDensity } = useLayoutDensity();
  const [activeDestinationId, setActiveDestinationId] = useState<DestinationId>(PORTAL_DESTINATIONS[0].id);

  return (
    <>
      <div className="fixed right-3 top-3 z-30">
        <ThemeControl paletteId={paletteId} onSelect={setPalette} density={density} onDensityChange={setDensity} />
      </div>
      <FeaturePortalMenu
        destinations={PORTAL_DESTINATIONS}
        activeDestinationId={activeDestinationId}
        onSelect={setActiveDestinationId}
      >
        <DestinationOutlet destinations={PORTAL_DESTINATIONS} activeDestinationId={activeDestinationId} />
      </FeaturePortalMenu>
    </>
  );
}
