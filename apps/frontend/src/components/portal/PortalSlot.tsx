import { useEffect, useRef } from "react";
import { usePortalSlot } from "../../lib/portal/slotContext";

/**
 * Marks where FeaturePortalMenu's button should render inline instead of its
 * fixed-position fallback. A destination header renders this once and stays
 * registered for as long as it's mounted — including while its destination is
 * inactive and hidden, since DestinationOutlet keeps visited destinations
 * mounted rather than unmounting them. FeaturePortalMenu tracks every
 * registered slot and picks whichever one is currently visible, so the button
 * only falls back to the fixed tab when none of the registered slots are
 * visible (e.g. a destination with no header at all).
 *
 * `self-start`: the host header grid uses `items-center` so its row is
 * vertically centered against the tallest column (the brand block) — without
 * this override, the tab's `-mt` lift (see `.portal-slot-tab`) would be
 * measured from that centered position instead of the row's true top, and
 * would land short of the card's border.
 */
export function PortalSlot(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { registerSlot, unregisterSlot } = usePortalSlot();

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    registerSlot(node);
    return () => unregisterSlot(node);
  }, [registerSlot, unregisterSlot]);

  return <div ref={ref} className="self-start" />;
}
