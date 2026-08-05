import { createContext, useContext } from "react";
import type { ConversationHistoryTriggerDescriptor } from "../../components/ConversationWorkspace";

export interface PortalSlotContextValue {
  registerSlot: (
    node: HTMLDivElement,
    getHistoryTrigger: () => ConversationHistoryTriggerDescriptor | undefined
  ) => void;
  unregisterSlot: (node: HTMLDivElement) => void;
  /** Registers a `PageShell`-owned clipping/sizing node (`.page-card` or the
      full-bleed shell) that the open Menu drawer should portal into instead of
      rendering in place, so the tray sizes itself against the outer shell
      (REQ-113) rather than a fixed viewport-relative height. */
  registerShellBounds: (node: HTMLDivElement) => void;
  unregisterShellBounds: (node: HTMLDivElement) => void;
}

/** No-op default so a destination header can render <PortalSlot /> and be tested
    in isolation, outside FeaturePortalMenu's provider, without crashing. */
const noopSlotContext: PortalSlotContextValue = {
  registerSlot: () => undefined,
  unregisterSlot: () => undefined,
  registerShellBounds: () => undefined,
  unregisterShellBounds: () => undefined
};

export const PortalSlotContext = createContext<PortalSlotContextValue>(noopSlotContext);

export function usePortalSlot(): PortalSlotContextValue {
  return useContext(PortalSlotContext);
}
