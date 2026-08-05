import type { FlowStepId } from "../contextFlow";
import type {
  CardMetadataItem,
  CombatStep,
  ConversationMessage,
  GameContext,
  PlayerLabel,
  TurnPhase,
  ZoneCardItem,
  ZoneId
} from "../../types";
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

/** Removes one entry by id. A no-op if the id is not present. Never throws (DEC-143 / REQ-118). */
export function deleteHistoryEntry(id: string): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    const remaining = readAllEntries().filter((candidate) => candidate.id !== id);
    storage.setItem(CONVERSATION_HISTORY_STORAGE_KEY, JSON.stringify(remaining));
  } catch {
    // Conversation history persistence must never interfere with the app's core flow.
  }
}

// --- Mid-flight Draft (REQ-108 / FLOW-017) ---
//
// A single, per-mode, browser-local snapshot of staging that happens *before* the
// first successful Ask AI submit (flowStep/gameContext/zones/question for In-Depth,
// selected card/question/locked topic for Quick Question). Mirrors the guarded-read
// pattern above but stays in its own per-mode storage key and never touches the
// completed-entries array or its 20-entry cap.

export type GameDraftState = {
  mode: "game";
  flowStep: FlowStepId;
  gameContext: GameContext | null;
  selectedZones: ZoneId[];
  zoneCardsByZone: Partial<Record<ZoneId, ZoneCardItem[]>>;
  question: string;
  turnPhase: TurnPhase;
  combatStep: CombatStep;
  confirmedPhase: TurnPhase | undefined;
  activePlayer: PlayerLabel;
  updatedAt: string;
};

export type LookupDraftState = {
  mode: "lookup";
  selectedCard: CardMetadataItem | null;
  question: string;
  lockedTopic: { id: string; title: string } | null;
  updatedAt: string;
};

export type ConversationDraft = GameDraftState | LookupDraftState;

const DRAFT_STORAGE_KEY_PREFIX = "thejudge.conversationDraft.";

function draftStorageKey(mode: ConversationHistoryMode): string {
  return `${DRAFT_STORAGE_KEY_PREFIX}${mode}`;
}

function isValidGameDraftState(value: unknown): value is GameDraftState {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;

  return (
    draft.mode === "game" &&
    typeof draft.flowStep === "string" &&
    (draft.gameContext === null || (typeof draft.gameContext === "object" && draft.gameContext !== null)) &&
    Array.isArray(draft.selectedZones) &&
    typeof draft.zoneCardsByZone === "object" &&
    draft.zoneCardsByZone !== null &&
    typeof draft.question === "string" &&
    typeof draft.turnPhase === "string" &&
    typeof draft.combatStep === "string" &&
    (draft.confirmedPhase === undefined || typeof draft.confirmedPhase === "string") &&
    typeof draft.activePlayer === "string" &&
    typeof draft.updatedAt === "string"
  );
}

function isValidLookupDraftState(value: unknown): value is LookupDraftState {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;

  return (
    draft.mode === "lookup" &&
    (draft.selectedCard === null || (typeof draft.selectedCard === "object" && draft.selectedCard !== null)) &&
    typeof draft.question === "string" &&
    (draft.lockedTopic === null || (typeof draft.lockedTopic === "object" && draft.lockedTopic !== null)) &&
    typeof draft.updatedAt === "string"
  );
}

/** Reads the stored Draft for a mode, dropping it silently if corrupt/invalid. Never throws. */
export function loadDraft(mode: "game"): GameDraftState | null;
export function loadDraft(mode: "lookup"): LookupDraftState | null;
export function loadDraft(mode: ConversationHistoryMode): ConversationDraft | null {
  try {
    const storage = getStorage();
    if (!storage) return null;

    const raw = storage.getItem(draftStorageKey(mode));
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (mode === "game") {
      return isValidGameDraftState(parsed) ? parsed : null;
    }
    return isValidLookupDraftState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Overwrites the single Draft slot for this draft's mode. Never throws. */
export function saveDraft(draft: Omit<GameDraftState, "updatedAt">): void;
export function saveDraft(draft: Omit<LookupDraftState, "updatedAt">): void;
export function saveDraft(draft: Omit<GameDraftState, "updatedAt"> | Omit<LookupDraftState, "updatedAt">): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    const full: ConversationDraft = { ...draft, updatedAt: new Date().toISOString() };
    storage.setItem(draftStorageKey(draft.mode), JSON.stringify(full));
  } catch {
    // Draft persistence must never interfere with the app's core flow.
  }
}

/** Clears the single Draft slot for a mode. Never throws. */
export function clearDraft(mode: ConversationHistoryMode): void {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.removeItem(draftStorageKey(mode));
  } catch {
    // Draft persistence must never interfere with the app's core flow.
  }
}
