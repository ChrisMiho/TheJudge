import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import type { RosterSeed } from "../lifeTracker/seed";
import type { CardMetadataItem } from "../../types";

/** REQ-206: the cards (and, when present, the typed question) carried from Ask a
 * Question's "Add in-depth details" pill into In-depth details. A second,
 * independent one-slot mailbox alongside the roster seed below — both can be
 * queued together (a quick-lookup visit entered from Life Tracker, then carried
 * onward) and each destination consumes only the one it understands. */
export type LookupCarrySeed = {
  cards: CardMetadataItem[];
  question: string;
};

export interface AssistantSeedContextValue {
  /** Queues a roster seed for the next consumer; a still-pending seed is replaced. */
  queueSeed: (seed: RosterSeed) => void;
  /** Atomically takes the pending seed, or returns null when nothing is queued. */
  consumeSeed: () => RosterSeed | null;
  /** Queues a lookup carry for the next consumer; a still-pending one is replaced. */
  queueLookupCarry: (seed: LookupCarrySeed) => void;
  /** Atomically takes the pending lookup carry, or returns null when nothing is queued. */
  consumeLookupCarry: () => LookupCarrySeed | null;
}

/** No-op default so a destination that consumes a seed can render and be tested
    in isolation, outside AssistantSeedProvider, without crashing. */
const noopSeedContext: AssistantSeedContextValue = {
  queueSeed: () => undefined,
  consumeSeed: () => null,
  queueLookupCarry: () => undefined,
  consumeLookupCarry: () => null
};

export const AssistantSeedContext = createContext<AssistantSeedContextValue>(noopSeedContext);

/**
 * Holds at most one pending roster seed and, independently, at most one pending
 * lookup carry. Each lives in its own ref rather than state: queueing must not
 * re-render the tree, and consuming must clear the pending value synchronously
 * so a second consumer cannot read the same seed twice. The provider is
 * deliberately unaware of localStorage, destination ids, and Assistant UI state.
 */
export function AssistantSeedProvider({ children }: { children: ReactNode }): JSX.Element {
  const pendingSeedRef = useRef<RosterSeed | null>(null);
  const pendingLookupCarryRef = useRef<LookupCarrySeed | null>(null);

  const value = useMemo<AssistantSeedContextValue>(
    () => ({
      queueSeed: (seed: RosterSeed) => {
        pendingSeedRef.current = seed;
      },
      consumeSeed: () => {
        const pending = pendingSeedRef.current;
        pendingSeedRef.current = null;
        return pending;
      },
      queueLookupCarry: (seed: LookupCarrySeed) => {
        pendingLookupCarryRef.current = seed;
      },
      consumeLookupCarry: () => {
        const pending = pendingLookupCarryRef.current;
        pendingLookupCarryRef.current = null;
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
