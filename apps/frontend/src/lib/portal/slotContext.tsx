import { createContext, useContext } from "react";

export interface PortalSlotContextValue {
  registerSlot: (node: HTMLDivElement) => void;
  unregisterSlot: (node: HTMLDivElement) => void;
}

/** No-op default so a destination header can render <PortalSlot /> and be tested
    in isolation, outside FeaturePortalMenu's provider, without crashing. */
const noopSlotContext: PortalSlotContextValue = {
  registerSlot: () => undefined,
  unregisterSlot: () => undefined
};

export const PortalSlotContext = createContext<PortalSlotContextValue>(noopSlotContext);

export function usePortalSlot(): PortalSlotContextValue {
  return useContext(PortalSlotContext);
}
