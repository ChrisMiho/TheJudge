import { useEffect, useRef } from "react";
import { usePortalSlot } from "../../lib/portal/slotContext";

/**
 * Marks where FeaturePortalMenu's button should render inline instead of its
 * fixed-position fallback. A destination header renders this once; the button
 * portals into it while mounted and the header falls back to the fixed tab
 * the moment this unmounts (e.g. a destination with no header at all).
 */
export function PortalSlot(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { registerSlot } = usePortalSlot();

  useEffect(() => {
    registerSlot(ref.current);
    return () => registerSlot(null);
  }, [registerSlot]);

  return <div ref={ref} />;
}
