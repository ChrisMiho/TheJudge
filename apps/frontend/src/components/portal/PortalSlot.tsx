import { useCallback, useEffect, useRef } from "react";
import type { ConversationHistoryTriggerDescriptor } from "../ConversationWorkspace";
import { usePortalSlot } from "../../lib/portal/slotContext";

type PortalSlotProps = {
  /** Descriptor for the destination's history control, if it has one — read via a
      "latest ref" getter so FeaturePortalMenu can ask "does the currently visible
      slot have a history trigger, and what does it do" without new prop plumbing
      between App.tsx and each destination (DEC-126). */
  historyTrigger?: ConversationHistoryTriggerDescriptor;
};

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
 * `.portal-slot`: a flex box in the header's left column (DEC-122), so the ☰
 * inside it is a flex item exactly as the mockup's `.menu-toggle` is a direct
 * child of `.app-header` (no inline line box shifting it off the row's centre).
 */
export function PortalSlot({ historyTrigger }: PortalSlotProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const historyTriggerRef = useRef(historyTrigger);
  historyTriggerRef.current = historyTrigger;
  const { registerSlot, unregisterSlot } = usePortalSlot();
  const getHistoryTrigger = useCallback(() => historyTriggerRef.current, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    registerSlot(node, getHistoryTrigger);
    return () => unregisterSlot(node);
  }, [registerSlot, unregisterSlot, getHistoryTrigger]);

  return <div ref={ref} className="portal-slot" />;
}
