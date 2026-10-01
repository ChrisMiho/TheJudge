import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { RosterSeed } from "../lifeTracker/seed";
import type { CardMetadataItem } from "../../types";
import type { ConversationHistoryEntry, ConversationHistoryMode } from "../conversationHistory/persistence";

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
  /** REQ-213/FLOW-016: queues a saved conversation for Question History's "resume live
   * in its own flow" hand-off, replacing a still-pending one. Bumps `historyResumeVersion`
   * so both destinations' consuming effects re-check even when the target destination was
   * already the active one (a plain mount effect would miss that case). */
  queueHistoryResume: (entry: ConversationHistoryEntry) => void;
  /** Mode-aware and race-safe: only clears and returns the pending entry when its own
   * `mode` matches the requested one, so whichever of the two destinations' effects runs
   * first never discards an entry meant for the other (both effects key off the same
   * `historyResumeVersion` bump and may run in either order). */
  consumeHistoryResume: (mode: ConversationHistoryMode) => ConversationHistoryEntry | null;
  /** REQ-118/FLOW-018: queues notice that a completed entry was deleted from Question
   * History, so the owning flow can clear its view *without re-saving* when that entry
   * was its active conversation — deletion now happens centrally (Question History's
   * own sheet), not inside either flow. Bumps `historyResumeVersion`, the same signal
   * a resume bump uses; a consumer checks both mailboxes on every bump. */
  queueHistoryDeletion: (entry: { id: string; mode: ConversationHistoryMode }) => void;
  /** Mode-aware and race-safe, same contract as `consumeHistoryResume`. */
  consumeHistoryDeletion: (mode: ConversationHistoryMode) => string | null;
  /** REQ-213/FLOW-017: queues "re-hydrate your own Draft now" for a flow's Draft row,
   * since a flow already mounted on its own destination has nothing to remount into —
   * only an explicit signal re-reads `loadDraft` for it. */
  queueDraftResume: (mode: ConversationHistoryMode) => void;
  /** Mode-aware and race-safe: returns whether a matching draft-resume was pending
   * (consuming it either way) rather than a payload — the payload is `localStorage`
   * itself, re-read by the consumer via the existing `loadDraft`. */
  consumeDraftResume: (mode: ConversationHistoryMode) => boolean;
  /** Reactive signal a consuming `useEffect` depends on, since the mailboxes themselves
   * live in refs (queueing must not re-render the whole tree). Incremented on every
   * `queueHistoryResume`, `queueHistoryDeletion`, or `queueDraftResume` call. */
  historyResumeVersion: number;
}

/** No-op default so a destination that consumes a seed can render and be tested
    in isolation, outside AssistantSeedProvider, without crashing. */
const noopSeedContext: AssistantSeedContextValue = {
  queueSeed: () => undefined,
  consumeSeed: () => null,
  queueLookupCarry: () => undefined,
  consumeLookupCarry: () => null,
  queueHistoryResume: () => undefined,
  consumeHistoryResume: () => null,
  queueHistoryDeletion: () => undefined,
  consumeHistoryDeletion: () => null,
  queueDraftResume: () => undefined,
  consumeDraftResume: () => false,
  historyResumeVersion: 0
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
  const pendingHistoryResumeRef = useRef<ConversationHistoryEntry | null>(null);
  const pendingHistoryDeletionRef = useRef<{ id: string; mode: ConversationHistoryMode } | null>(null);
  const pendingDraftResumeRef = useRef<ConversationHistoryMode | null>(null);
  const [historyResumeVersion, setHistoryResumeVersion] = useState(0);

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
      },
      queueHistoryResume: (entry: ConversationHistoryEntry) => {
        pendingHistoryResumeRef.current = entry;
        setHistoryResumeVersion((current) => current + 1);
      },
      consumeHistoryResume: (mode: ConversationHistoryMode) => {
        const pending = pendingHistoryResumeRef.current;
        if (!pending || pending.mode !== mode) {
          return null;
        }
        pendingHistoryResumeRef.current = null;
        return pending;
      },
      queueHistoryDeletion: (entry: { id: string; mode: ConversationHistoryMode }) => {
        pendingHistoryDeletionRef.current = entry;
        setHistoryResumeVersion((current) => current + 1);
      },
      consumeHistoryDeletion: (mode: ConversationHistoryMode) => {
        const pending = pendingHistoryDeletionRef.current;
        if (!pending || pending.mode !== mode) {
          return null;
        }
        pendingHistoryDeletionRef.current = null;
        return pending.id;
      },
      queueDraftResume: (mode: ConversationHistoryMode) => {
        pendingDraftResumeRef.current = mode;
        setHistoryResumeVersion((current) => current + 1);
      },
      consumeDraftResume: (mode: ConversationHistoryMode) => {
        if (pendingDraftResumeRef.current !== mode) {
          return false;
        }
        pendingDraftResumeRef.current = null;
        return true;
      },
      historyResumeVersion
    }),
    [historyResumeVersion]
  );

  return <AssistantSeedContext.Provider value={value}>{children}</AssistantSeedContext.Provider>;
}

export function useAssistantSeed(): AssistantSeedContextValue {
  return useContext(AssistantSeedContext);
}
