import { useMemo, useRef, useState, type ReactNode } from "react";
import type { RosterSeed } from "../lifeTracker/seed";
import type { ConversationHistoryEntry, ConversationHistoryMode } from "../conversationHistory/persistence";
import {
  AssistantSeedContext,
  type AssistantSeedContextValue,
  type LookupCarrySeed
} from "./seedContext";

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
