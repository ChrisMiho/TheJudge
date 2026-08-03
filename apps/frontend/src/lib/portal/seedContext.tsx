import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import type { RosterSeed } from "../lifeTracker/seed";

export interface AssistantSeedContextValue {
  /** Queues a roster seed for the next consumer; a still-pending seed is replaced. */
  queueSeed: (seed: RosterSeed) => void;
  /** Atomically takes the pending seed, or returns null when nothing is queued. */
  consumeSeed: () => RosterSeed | null;
}

/** No-op default so a destination that consumes a seed can render and be tested
    in isolation, outside AssistantSeedProvider, without crashing. */
const noopSeedContext: AssistantSeedContextValue = {
  queueSeed: () => undefined,
  consumeSeed: () => null
};

export const AssistantSeedContext = createContext<AssistantSeedContextValue>(noopSeedContext);

/**
 * Holds at most one pending roster seed. The seed lives in a ref rather than
 * state: queueing must not re-render the tree, and consuming must clear the
 * pending value synchronously so a second consumer cannot read the same seed
 * twice. The provider is deliberately unaware of localStorage, destination ids,
 * and Assistant UI state.
 */
export function AssistantSeedProvider({ children }: { children: ReactNode }): JSX.Element {
  const pendingSeedRef = useRef<RosterSeed | null>(null);

  const value = useMemo<AssistantSeedContextValue>(
    () => ({
      queueSeed: (seed: RosterSeed) => {
        pendingSeedRef.current = seed;
      },
      consumeSeed: () => {
        const pending = pendingSeedRef.current;
        pendingSeedRef.current = null;
        return pending;
      }
    }),
    []
  );

  return <AssistantSeedContext.Provider value={value}>{children}</AssistantSeedContext.Provider>;
}

export function useAssistantSeed(): AssistantSeedContextValue {
  return useContext(AssistantSeedContext);
}
