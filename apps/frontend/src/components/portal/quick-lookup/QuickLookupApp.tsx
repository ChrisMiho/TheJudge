import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAutocompleteKeyboard } from "../../../hooks/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "../../../hooks/useAutocompleteSuggestions";
import { useAskAiSubmitOrchestration } from "../../../hooks/useAskAiSubmitOrchestration";
import { useAutoGrowTextarea } from "../../../hooks/useAutoGrowTextarea";
import { ComposerSubmitButton } from "../../ComposerSubmitButton";
import { useScanCapture } from "../../../hooks/useScanCapture";
import { buildLookupAskAiRequest } from "../../../lib/contextFlow";
import type { ConversationHistoryEntry, LookupDraftState } from "../../../lib/conversationHistory/persistence";
import {
  clearDraft,
  deleteHistoryEntry,
  loadDraft,
  loadHistoryEntries,
  saveDraft,
  saveHistoryEntry
} from "../../../lib/conversationHistory/persistence";
import { apiBaseUrl } from "../../../lib/env";
import { prefersReducedMotion } from "../../../lib/motionPreference";
import { NO_MATCH_COPY } from "../../../lib/search";
import type { CardMetadataItem } from "../../../types";
import { AskAiWaitingPanel } from "../../AskAiWaitingPanel";
import { CardSelectionPreview } from "../../CardSelectionPreview";
import { ConversationHistoryDrawer } from "../../ConversationHistoryDrawer";
import { ConversationWorkspace } from "../../ConversationWorkspace";
import { PageShell } from "../../PageShell";
import { ScanCameraSurface } from "../../ScanCameraSurface";
import { StagedStepHeader } from "../../StagedStepHeader";
import { StepEyebrow } from "../../StepEyebrow";

const FLOW_LABEL = "Quick Question";

const CARD_METADATA_URL = "/data/cardMetadata.json";
const CORE_TOPICS_URL = "/data/gameRulesCoreTopics.json";
const MAX_QUESTION_LENGTH = 300;
const RETRY_COOLDOWN_SECONDS = 13;
// REQ-167: the single optional card generalizes to a bounded (max 5) list.
const MAX_LOOKUP_CARDS = 5;

/**
 * The silent fallback question when only card(s) are attached and no locked
 * topic or typed text exists. A single card renders exactly as before
 * ("Tell me about X."); REQ-167 generalizes it to name every attached card.
 */
function composeCardsFallbackQuestion(cards: CardMetadataItem[]): string {
  if (cards.length === 0) return "";
  if (cards.length === 1) return `Tell me about ${cards[0]!.name}.`;
  const names = cards.map((card) => card.name);
  const last = names[names.length - 1];
  const rest = names.slice(0, -1);
  return `Tell me about ${rest.join(", ")} and ${last}.`;
}

function formatCardsTriggerLabel(cards: Array<{ name: string }>): string {
  if (cards.length === 1) return cards[0]!.name;
  return `${cards.length} cards`;
}

type CoreTopic = {
  id: string;
  title: string;
  ruleNumbers: string[];
  excerpt: string;
};

export type QuickLookupAppProps = {
  onSubmit?: (question: string, cards: CardMetadataItem[]) => void;
  isActive?: boolean;
};

export function QuickLookupApp({ onSubmit, isActive = true }: QuickLookupAppProps): JSX.Element {
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [coreTopics, setCoreTopics] = useState<CoreTopic[]>([]);
  const [isTopicsLoading, setIsTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCards, setSelectedCards] = useState<CardMetadataItem[]>([]);
  const [cardLimitMessage, setCardLimitMessage] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [lockedTopic, setLockedTopic] = useState<Pick<CoreTopic, "id" | "title"> | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const closeScanRef = useRef<() => void>(() => undefined);
  const questionContainerRef = useRef<HTMLFormElement>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<ConversationHistoryEntry[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [lookupDraft, setLookupDraft] = useState<LookupDraftState | null>(null);
  const {
    error,
    isSubmitting,
    isFollowUpSubmitting,
    retryCountdown,
    canRetry,
    visibleMessages,
    frozenContext,
    isConversationActive,
    submitAttempt,
    submitFollowUp,
    startOver,
    restoreConversation
  } = useAskAiSubmitOrchestration({
    apiBaseUrl,
    retryCooldownSeconds: RETRY_COOLDOWN_SECONDS,
    onConversationUpdated: (snapshot) => {
      const existing = loadHistoryEntries().find((entry) => entry.id === snapshot.conversationId);
      const now = new Date().toISOString();
      saveHistoryEntry({
        id: snapshot.conversationId,
        mode: "lookup",
        flowLabel: FLOW_LABEL,
        frozenContext: snapshot.frozenContext,
        hiddenInitialQuestion: snapshot.hiddenInitialQuestion,
        visibleMessages: snapshot.visibleMessages,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
      setActiveConversationId(snapshot.conversationId);
      // First successful Ask AI submit for the attempt: the mid-flight Draft is now a
      // completed history entry (saved just above), so drop the Draft slot (REQ-108).
      clearDraft("lookup");
    }
  });

  function hydrateFromLookupDraft(draft: LookupDraftState): void {
    setSelectedCards(draft.selectedCards);
    setQuestion(draft.question);
    setLockedTopic(draft.lockedTopic);
  }

  // Mid-flight Draft auto-hydrate (REQ-108 / FLOW-017): this destination mounts once per
  // session (DestinationOutlet keeps it mounted-but-hidden afterward), so a mount-only
  // effect covers exactly the "reload" case FLOW-017 calls out — Menu-leave-and-back within
  // the same session already survives via this component staying mounted in memory.
  useEffect(() => {
    const draft = loadDraft("lookup");
    if (draft) hydrateFromLookupDraft(draft);
  }, []);

  const wasActiveForDraftRef = useRef(isActive);

  // The single definition of "snapshot whatever mid-flight staging exists right now"
  // (REQ-108). Every mid-flight exit calls this one function rather than restating the
  // staging predicate and Draft payload at each call site — two copies would drift the
  // moment a staging field is added, and a drifted copy is exactly how the history-select
  // exit came to be uncovered in the first place.
  //
  // An active answered conversation has its own completed-history entry and no Draft to
  // maintain, so it is a no-op. Empty staging clears rather than writes, so a stale Draft
  // does not outlive the work it described.
  function snapshotMidFlightDraft(): void {
    if (isConversationActive) return;

    const hasStaging = selectedCards.length > 0 || question.trim().length > 0 || lockedTopic !== null;

    if (hasStaging) {
      saveDraft({ mode: "lookup", selectedCards, question, lockedTopic });
    } else {
      clearDraft("lookup");
    }
  }

  // Mid-flight Draft snapshot on Menu-leave (FLOW-017's "Menu-leave snapshot"). Reacts only
  // to the isActive true→false edge; other staging fields are read via closure at the time of
  // that transition, not listed as deps, so typing doesn't re-fire this on every keystroke.
  useEffect(() => {
    const wasActive = wasActiveForDraftRef.current;
    wasActiveForDraftRef.current = isActive;
    if (!wasActive || isActive) return;

    snapshotMidFlightDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts only to the isActive edge; staging fields are read via closure at fire time, not listed, so typing doesn't re-fire this.
  }, [isActive]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCardMetadata(): Promise<void> {
      try {
        const response = await fetch(CARD_METADATA_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Card metadata fetch failed with status ${response.status}`);
        }
        setCardMetadata((await response.json()) as CardMetadataItem[]);
      } catch {
        if (!controller.signal.aborted) {
          setMetadataError("Card search is unavailable. You can still ask without a card.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsMetadataLoading(false);
        }
      }
    }

    async function loadCoreTopics(): Promise<void> {
      try {
        const response = await fetch(CORE_TOPICS_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Core topics fetch failed with status ${response.status}`);
        }
        setCoreTopics((await response.json()) as CoreTopic[]);
      } catch {
        if (!controller.signal.aborted) {
          setTopicsError("Core topics are unavailable. Type a Magic question to continue.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsTopicsLoading(false);
        }
      }
    }

    void loadCardMetadata();
    void loadCoreTopics();

    return () => controller.abort();
  }, []);

  // REQ-167: an add beyond the 5-card cap is blocked with a stated limit
  // message, mirroring the existing bounded-add UX pattern (`ScanAddOutcome`,
  // the In-Depth zone-collection strip). A card already in the list is not
  // added again.
  function addLookupCard(card: CardMetadataItem): { added: true } | { added: false; message: string } {
    if (selectedCards.some((existing) => existing.cardId === card.cardId)) {
      return { added: false, message: `${card.name} is already attached to this question.` };
    }
    if (selectedCards.length >= MAX_LOOKUP_CARDS) {
      return {
        added: false,
        message: `You've added ${MAX_LOOKUP_CARDS} cards, the most one Quick Question can use. Remove a card below to add another.`
      };
    }
    setSelectedCards((current) => [...current, card]);
    return { added: true };
  }

  function selectCard(card: CardMetadataItem): void {
    setSearchInput("");
    const outcome = addLookupCard(card);
    setCardLimitMessage(outcome.added ? null : outcome.message);
  }

  function removeCard(cardId: string): void {
    setSelectedCards((current) => current.filter((card) => card.cardId !== cardId));
    setCardLimitMessage(null);
  }

  const suggestions = useAutocompleteSuggestions({
    cards: cardMetadata,
    query: searchInput
  });
  const keyboard = useAutocompleteKeyboard({
    query: searchInput,
    suggestions,
    onSelect: selectCard
  });
  const scanCapture = useScanCapture({
    cardMetadata,
    onScanCandidateSelected: (card) => {
      const outcome = addLookupCard(card);
      setCardLimitMessage(outcome.added ? null : outcome.message);
      if (outcome.added) {
        closeScanRef.current();
      }
      return outcome;
    }
  });
  closeScanRef.current = scanCapture.closeScan;

  const normalizedSearchLength = searchInput.trim().length;
  const showSuggestionPanel =
    normalizedSearchLength >= 3 && (isMetadataLoading || keyboard.isOpen || suggestions.length === 0);
  const trimmedQuestion = question.trim();
  const composedQuestion =
    [lockedTopic ? `Tell me about ${lockedTopic.title}.` : null, trimmedQuestion || null]
      .filter((part): part is string => part !== null)
      .join(" ") || composeCardsFallbackQuestion(selectedCards);
  const hasQuestionContent =
    lockedTopic !== null || selectedCards.length > 0 || trimmedQuestion.length > 0;
  // The counter, the textarea cap, and this gate all measure the raw editable text.
  // `composedQuestion` may legitimately exceed the cap once a topic pill or the silent
  // card fallback is prepended, and that composed string is what gets submitted.
  const canSubmit = hasQuestionContent && question.length <= MAX_QUESTION_LENGTH;

  function handleTopicSelection(topic: CoreTopic): void {
    setLockedTopic({ id: topic.id, title: topic.title });
    questionContainerRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center"
    });
    questionInputRef.current?.focus();
  }

  async function submitLookup(source: "decrypt" | "retry"): Promise<void> {
    if (!canSubmit) return;
    const payload = buildLookupAskAiRequest(composedQuestion, selectedCards);
    await submitAttempt({
      source,
      payload,
      stackSize: 0,
      finalQuestion: payload.question,
      usedFallbackQuestion:
        lockedTopic === null && trimmedQuestion.length === 0 && selectedCards.length > 0
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    if (onSubmit) {
      onSubmit(composedQuestion, selectedCards);
      return;
    }
    void submitLookup("decrypt");
  }

  function handleStartOver(): void {
    startOver();
    setQuestion("");
    setLockedTopic(null);
    setSelectedCards([]);
    setCardLimitMessage(null);
    setSearchInput("");
    setOpenTopicId(null);
    setActiveConversationId(null);
    closeScanRef.current();
  }

  function openHistory(): void {
    setHistoryEntries(loadHistoryEntries("lookup"));
    setLookupDraft(loadDraft("lookup"));
    setIsHistoryOpen(true);
  }

  function handleSelectHistoryEntry(entry: ConversationHistoryEntry): void {
    // Opening a saved conversation is the third mid-flight exit (DEC-138), alongside
    // Menu-leave and reload. It never changes `isActive` — this destination stays mounted
    // and active — so the edge effect above cannot see it, and without this call
    // restoreConversation would overwrite staged work with nothing recoverable. Snapshot
    // first, then restore, so the staged attempt reappears as the Draft row in the same
    // drawer the user is already looking at. Silent by design: no dialog, no notice.
    snapshotMidFlightDraft();
    restoreConversation(entry);
    setActiveConversationId(entry.id);
    setIsHistoryOpen(false);
  }

  // DEC-143/REQ-118/FLOW-018: deletes a completed entry from storage and refreshes the list
  // first; only then, if it was the active conversation, clears the workspace by reusing the
  // same handleStartOver path Start Over already uses. handleStartOver's own resets (not
  // onConversationUpdated) are what run here, so the deleted thread is never re-saved.
  function handleDeleteHistoryEntry(entry: ConversationHistoryEntry): void {
    deleteHistoryEntry(entry.id);
    setHistoryEntries(loadHistoryEntries("lookup"));
    if (entry.id === activeConversationId) {
      handleStartOver();
    }
  }

  function handleSelectDraft(draft: LookupDraftState): void {
    hydrateFromLookupDraft(draft);
    setIsHistoryOpen(false);
  }

  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const frozenLookupCards =
    frozenContext?.kind === "lookup" ? frozenContext.cards : [];
  useAutoGrowTextarea(question, questionInputRef);

  if (isConversationActive) {
    return (
      <PageShell>
        <StagedStepHeader historyTrigger={{ onOpen: openHistory }} />
        <StepEyebrow stepName="Quick Question" />

        <ConversationHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          entries={historyEntries}
          activeConversationId={activeConversationId}
          onSelectEntry={handleSelectHistoryEntry}
          onDeleteEntry={handleDeleteHistoryEntry}
          draft={lookupDraft ? { updatedAt: lookupDraft.updatedAt, onSelect: () => handleSelectDraft(lookupDraft) } : null}
        />

        <ConversationWorkspace
          messages={visibleMessages}
          context={
            frozenLookupCards.length > 0
              ? {
                  triggerLabel: formatCardsTriggerLabel(frozenLookupCards),
                  dialogLabel: "Card context",
                  content: (
                    <div className="flex flex-col gap-3">
                      {frozenLookupCards.map((card) => (
                        <CardSelectionPreview key={card.cardId} card={card} />
                      ))}
                    </div>
                  )
                }
              : undefined
          }
          error={error}
          canRetry={canRetry}
          retryLabel={retryLabel}
          onRetry={() => submitLookup("retry")}
          isFollowUpSubmitting={isFollowUpSubmitting}
          onFollowUp={submitFollowUp}
          onStartOver={handleStartOver}
          showStartOver={!isSubmitting && !isFollowUpSubmitting}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {!scanCapture.isOpen && (
        <>
          <StagedStepHeader historyTrigger={{ onOpen: openHistory }} />
          <StepEyebrow stepName="Quick Question" />
        </>
      )}

      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={historyEntries}
        activeConversationId={activeConversationId}
        onSelectEntry={handleSelectHistoryEntry}
        onDeleteEntry={handleDeleteHistoryEntry}
        draft={lookupDraft ? { updatedAt: lookupDraft.updatedAt, onSelect: () => handleSelectDraft(lookupDraft) } : null}
      />

      {scanCapture.isOpen ? (
        <section className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-3">
          {scanCapture.isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300">
              Loading scan data...
            </p>
          ) : (
            <>
              <div className="flex min-h-10 items-center justify-end">
                <button
                  type="button"
                  onClick={scanCapture.closeScan}
                  className="min-h-10 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Exit scan
                </button>
              </div>
              <ScanCameraSurface
                onCapture={() => undefined}
                identify={scanCapture.identify}
                onStatusChange={scanCapture.setCameraStatus}
                onAcquisitionDiagnostic={scanCapture.recordAcquisitionDiagnostic}
                convergence={scanCapture.convergence}
                confirmation={scanCapture.addConfirmation}
                debug={scanCapture.scanDebug}
                autoScanFps={3}
              />
            </>
          )}
          {scanCapture.error && (
            <p className="motion-error rounded-xl border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {scanCapture.error}
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
              <span>Optional cards</span>{" — "}
              <span className="text-sm font-normal normal-case tracking-normal text-zinc-400">
                {/* REQ-167: up to 5 cards, added one at a time; ask with no card at all works too. */}
                Add up to {MAX_LOOKUP_CARDS} cards for context, or ask any Magic related question.
              </span>
              <span className="mt-2 grid gap-2 normal-case tracking-normal sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  aria-label="Card search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={keyboard.handleKeyDown}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm"
                  placeholder={selectedCards.length > 0 ? "Search to add another card" : "Type at least 3 characters"}
                />
                <button
                  type="button"
                  aria-label="Scan a card"
                  onClick={() => void scanCapture.openScan()}
                  className="rounded-xl border border-accent/70 bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-soft transition hover:bg-accent/25"
                >
                  Scan
                </button>
              </span>
            </label>

            {showSuggestionPanel && (
              <div className="rounded-xl border border-zinc-600 bg-zinc-800/70 p-2">
                {isMetadataLoading ? (
                  <p className="px-2 py-1 text-sm text-zinc-400">Loading cards...</p>
                ) : suggestions.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-zinc-400">{NO_MATCH_COPY}</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {suggestions.map((card, index) => (
                      <li key={card.cardId}>
                        <button
                          type="button"
                          onClick={() => {
                            selectCard(card);
                            keyboard.closeSuggestions();
                          }}
                          onMouseEnter={() => keyboard.setActiveIndex(index)}
                          className={`w-full rounded-lg px-2 py-2 text-left text-sm text-zinc-200 transition hover:text-accent-soft ${
                            keyboard.activeIndex === index
                              ? "bg-zinc-700 text-accent-soft"
                              : "hover:bg-zinc-700"
                          }`}
                        >
                          {card.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {metadataError && <p className="text-sm text-amber-200">{metadataError}</p>}
            {cardLimitMessage && <p className="text-sm text-amber-200">{cardLimitMessage}</p>}

            {selectedCards.length > 0 && (
              <div className="flex flex-col gap-3">
                {selectedCards.map((card) => (
                  <CardSelectionPreview
                    key={card.cardId}
                    card={card}
                    action={
                      // REQ-133: the smaller Remove action is all that stays beside/below the
                      // image now that the duplicated metadata panel is gone.
                      <button
                        type="button"
                        aria-label={`Remove ${card.name}`}
                        onClick={() => removeCard(card.cardId)}
                        className="min-h-11 rounded-xl border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
                      >
                        Remove card
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {isSubmitting ? (
            <AskAiWaitingPanel isSubmitting={isSubmitting} />
          ) : (
            <form ref={questionContainerRef} onSubmit={handleSubmit} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="quick-lookup-question"
                  className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300"
                >
                  Question
                </label>
                {lockedTopic && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-accent/70 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-soft">
                    <span>{`Tell me about ${lockedTopic.title}.`}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${lockedTopic.title} topic`}
                      onClick={() => setLockedTopic(null)}
                      className="rounded-full px-1 text-sm leading-none text-accent-soft transition hover:bg-accent/25"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              {/* Tighter inset and gaps below `sm` keep the field the dominant element of
                  the row at phone widths (DEC-146, REQ-121); `sm+` keeps today's spacing.
                  The counter stacks above the submit control (rather than sitting beside it
                  as a third flex sibling) so DEC-153's every-width visible "Send Request"
                  label does not spend its own row-width budget starving the field back below
                  REQ-121's 65% floor. */}
              <div className="ambient-accent-surface ambient-accent-interactive flex items-end gap-1 rounded-3xl border border-zinc-700/70 bg-zinc-900/55 py-2 pl-2 pr-1 sm:gap-2 sm:pl-4 sm:pr-2">
                <textarea
                  ref={questionInputRef}
                  id="quick-lookup-question"
                  aria-label="Magic question"
                  value={question}
                  maxLength={MAX_QUESTION_LENGTH}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={1}
                  className="min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm normal-case tracking-normal text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                  placeholder={
                    lockedTopic
                      ? "Add anything specific — or leave this blank and just ask."
                      : "What would you like to know?"
                  }
                />
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="pr-0.5 text-[10px] leading-none text-zinc-400 sm:text-xs">
                    {question.length}/{MAX_QUESTION_LENGTH}
                  </span>
                  <ComposerSubmitButton
                    label="Ask TheJudge"
                    visibleLabel="Send Request"
                    pendingLabel="Asking…"
                    isSubmitting={isSubmitting}
                    disabled={!canSubmit || isSubmitting}
                    showLabelBelowSm
                  />
                </div>
              </div>
            </form>
          )}

          <details className="rounded-2xl border border-zinc-700/70 bg-zinc-900/55">
            <summary className="cursor-pointer px-4 py-3 text-zinc-100 marker:text-zinc-400">
              <h3 className="ml-2 inline text-base font-semibold">General rules topics</h3>
            </summary>
            <div className="space-y-3 border-t border-zinc-700/70 p-4">
              <p className="text-sm text-zinc-400">Choose a topic to start a question without calling the model.</p>
              {isTopicsLoading ? (
                <p className="text-sm text-zinc-400">Loading core topics...</p>
              ) : topicsError ? (
                <p className="text-sm text-amber-200">{topicsError}</p>
              ) : (
                <div className="space-y-3">
                  {coreTopics.map((topic) => (
                    <details
                      key={topic.id}
                      open={openTopicId === topic.id}
                      onToggle={(event) => {
                        if (event.currentTarget.open) {
                          setOpenTopicId(topic.id);
                          return;
                        }
                        setOpenTopicId((currentTopicId) =>
                          currentTopicId === topic.id ? null : currentTopicId
                        );
                      }}
                      className="rounded-xl border border-zinc-700 bg-zinc-950/35"
                    >
                      <summary className="cursor-pointer px-3 py-3 text-zinc-100 marker:text-zinc-400">
                        <div className="ml-2 inline-flex w-[calc(100%_-_2rem)] items-center justify-between gap-3 align-middle">
                          <h4 className="font-semibold text-zinc-100">{topic.title}</h4>
                          <button
                            type="button"
                            aria-label={`Add ${topic.title} to question`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleTopicSelection(topic);
                            }}
                            className="rounded-lg border border-accent/70 bg-accent/15 px-3 py-2 text-sm font-semibold text-accent-soft transition hover:bg-accent/25"
                          >
                            Use this topic
                          </button>
                        </div>
                      </summary>
                      <p className="border-t border-zinc-700/70 p-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {topic.excerpt}
                      </p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </details>

          {error && (
            <div className="motion-error space-y-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4">
              <p className="text-sm text-rose-300">{error}</p>
              <button
                type="button"
                disabled={!canRetry}
                onClick={() => void submitLookup("retry")}
                className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {retryLabel}
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
