import { createContext, useContext } from "react";

export interface PortalSlotContextValue {
  slotNode: HTMLDivElement | null;
  registerSlot: (node: HTMLDivElement | null) => void;
}

/** No-op default so a destination header can render <PortalSlot /> and be tested
    in isolation, outside FeaturePortalMenu's provider, without crashing. */
const noopSlotContext: PortalSlotContextValue = {
  slotNode: null,
  registerSlot: () => undefined
};

export const PortalSlotContext = createContext<PortalSlotContextValue>(noopSlotContext);

export function usePortalSlot(): PortalSlotContextValue {
  return useContext(PortalSlotContext);
}
