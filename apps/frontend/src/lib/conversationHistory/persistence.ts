import type { ConversationMessage } from "../../types";
import type { FrozenAskAiContext } from "../../hooks/useAskAiSubmitOrchestration";

export type ConversationHistoryMode = "game" | "lookup";

export type ConversationHistoryEntry = {
  id: string;
  mode: ConversationHistoryMode;
  flowLabel: string;
  frozenContext: FrozenAskAiContext;
  hiddenInitialQuestion: string;
  visibleMessages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
};

/** DEC-103-style: browser-local, single-device, frontend-only persistence key. */
export const CONVERSATION_HISTORY_STORAGE_KEY = "thejudge.conversationHistory.entries";

const MAX_ENTRIES = 20;

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isConversationHistoryMode(value: unknown): value is ConversationHistoryMode {
  return value === "game" || value === "lookup";
}

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (message.role === "user" || message.role === "assistant") && typeof message.content === "string";
}

function isFrozenAskAiContext(value: unknown): value is FrozenAskAiContext {
  if (typeof value !== "object" || value === null) return false;
  const context = value as Record<string, unknown>;

  if (context.kind === "game") {
    return typeof context.gameContext === "object" && context.gameContext !== null;
  }

  return context.kind === "lookup" && "card" in context;
}

function isValidConversationHistoryEntry(value: unknown): value is ConversationHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    isConversationHistoryMode(entry.mode) &&
    typeof entry.flowLabel === "string" &&
    isFrozenAskAiContext(entry.frozenContext) &&
    typeof entry.hiddenInitialQuestion === "string" &&
    Array.isArray(entry.visibleMessages) &&
    entry.visibleMessages.every(isConversationMessage) &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string"
  );
}

/** Reads every stored entry, dropping individually invalid ones rather than discarding the whole list. Never throws. */
function readAllEntries(): ConversationHistoryEntry[] {
  try {
    const storage = getStorage();
    if (!storage) return [];

    const raw = storage.getItem(CONVERSATION_HISTORY_STORAGE_KEY);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidConversationHistoryEntry);
  } catch {
    return [];
  }
}

/** Returns stored entries most-recent-first, optionally filtered by mode. Never throws. */
export function loadHistoryEntries(mode?: ConversationHistoryMode): ConversationHistoryEntry[] {
  return readAllEntries()
    .filter((entry) => !mode || entry.mode === mode)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Upserts by id, then prunes to the 20 most-recently-updated entries across all modes. Never throws. */
export function saveHistoryEntry(entry: ConversationHistoryEntry): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    const remaining = readAllEntries().filter((candidate) => candidate.id !== entry.id);
    const merged = [...remaining, entry]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_ENTRIES);

    storage.setItem(CONVERSATION_HISTORY_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Conversation history persistence must never interfere with the app's core flow.
  }
}
