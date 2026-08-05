import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAutocompleteKeyboard } from "../../../hooks/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "../../../hooks/useAutocompleteSuggestions";
import { useAskAiSubmitOrchestration } from "../../../hooks/useAskAiSubmitOrchestration";
import { useAutoGrowTextarea } from "../../../hooks/useAutoGrowTextarea";
import { useScanCapture } from "../../../hooks/useScanCapture";
import { buildLookupAskAiRequest } from "../../../lib/contextFlow";
import type { ConversationHistoryEntry, LookupDraftState } from "../../../lib/conversationHistory/persistence";
import {
  clearDraft,
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

type CoreTopic = {
  id: string;
  title: string;
  ruleNumbers: string[];
  excerpt: string;
};

export type QuickLookupAppProps = {
  onSubmit?: (question: string, card: CardMetadataItem | null) => void;
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
  const [selectedCard, setSelectedCard] = useState<CardMetadataItem | null>(null);
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
    setSelectedCard(draft.selectedCard);
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

  // Mid-flight Draft snapshot on Menu-leave (FLOW-017's "Menu-leave snapshot"): only while
  // still pre-submit — an active answered conversation already has its own completed-history
  // entry and no Draft to maintain. Reacts only to the isActive true→false edge; other staging
  // fields are read via closure at the time of that transition, not listed as deps, so typing
  // doesn't re-fire this on every keystroke.
  useEffect(() => {
    const wasActive = wasActiveForDraftRef.current;
    wasActiveForDraftRef.current = isActive;
    if (!wasActive || isActive || isConversationActive) return;

    const hasStaging = selectedCard !== null || question.trim().length > 0 || lockedTopic !== null;

    if (hasStaging) {
      saveDraft({ mode: "lookup", selectedCard, question, lockedTopic });
    } else {
      clearDraft("lookup");
    }
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

  function selectCard(card: CardMetadataItem): void {
    setSelectedCard(card);
    setSearchInput("");
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
      selectCard(card);
      closeScanRef.current();
      return { added: true };
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
      .join(" ") || (selectedCard ? `Tell me about ${selectedCard.name}.` : "");
  const hasQuestionContent =
    lockedTopic !== null || selectedCard !== null || trimmedQuestion.length > 0;
  const canSubmit = hasQuestionContent && composedQuestion.length <= MAX_QUESTION_LENGTH;

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
    const payload = buildLookupAskAiRequest(composedQuestion, selectedCard);
    await submitAttempt({
      source,
      payload,
      stackSize: 0,
      finalQuestion: payload.question,
      usedFallbackQuestion:
        lockedTopic === null && trimmedQuestion.length === 0 && selectedCard !== null
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    if (onSubmit) {
      onSubmit(composedQuestion, selectedCard);
      return;
    }
    void submitLookup("decrypt");
  }

  function handleStartOver(): void {
    startOver();
    setQuestion("");
    setLockedTopic(null);
    setSelectedCard(null);
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
    restoreConversation(entry);
    setActiveConversationId(entry.id);
    setIsHistoryOpen(false);
  }

  function handleSelectDraft(draft: LookupDraftState): void {
    hydrateFromLookupDraft(draft);
    setIsHistoryOpen(false);
  }

  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const frozenLookupCard =
    frozenContext?.kind === "lookup" ? frozenContext.card : null;
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
          draft={lookupDraft ? { updatedAt: lookupDraft.updatedAt, onSelect: () => handleSelectDraft(lookupDraft) } : null}
        />

        <ConversationWorkspace
          messages={visibleMessages}
          context={
            frozenLookupCard
              ? {
                  triggerLabel: frozenLookupCard.name,
                  dialogLabel: "Card context",
                  content: (
                    <CardSelectionPreview
                      card={frozenLookupCard}
                      contextTitle="Lookup card"
                      contextContent={null}
                      showContextSection={false}
                    />
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
              <span>Optional card</span>{" — "}
              <span className="text-sm font-normal normal-case tracking-normal text-zinc-400">
                Add a card for context or ask any Magic related question.
              </span>
              <span className="mt-2 grid gap-2 normal-case tracking-normal sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  aria-label="Card search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={keyboard.handleKeyDown}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm"
                  placeholder={selectedCard ? "Search to replace card" : "Type at least 3 characters"}
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

            {selectedCard && (
              <CardSelectionPreview
                card={selectedCard}
                contextTitle="Lookup card"
                contextContent={null}
                showContextSection={false}
                action={
                  <button
                    type="button"
                    aria-label={`Remove ${selectedCard.name}`}
                    onClick={() => setSelectedCard(null)}
                    className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700"
                  >
                    Remove card
                  </button>
                }
              />
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
              <div className="ambient-accent-surface ambient-accent-interactive flex items-end gap-2 rounded-3xl border border-zinc-700/70 bg-zinc-900/55 py-2 pl-4 pr-2">
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
                <span className="shrink-0 pb-1.5 text-xs text-zinc-400">
                  {composedQuestion.length}/{MAX_QUESTION_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="shrink-0 rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Asking…" : "Ask TheJudge"}
                </button>
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
