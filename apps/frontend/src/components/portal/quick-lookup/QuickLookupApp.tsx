import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAutocompleteKeyboard } from "../../../hooks/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "../../../hooks/useAutocompleteSuggestions";
import { useAskAiSubmitOrchestration } from "../../../hooks/useAskAiSubmitOrchestration";
import { useScanCapture } from "../../../hooks/useScanCapture";
import { buildLookupAskAiRequest } from "../../../lib/contextFlow";
import { apiBaseUrl } from "../../../lib/env";
import { NO_MATCH_COPY } from "../../../lib/search";
import type { CardMetadataItem } from "../../../types";
import { AskAiWaitingPanel } from "../../AskAiWaitingPanel";
import { CardSelectionPreview } from "../../CardSelectionPreview";
import { ConversationThread } from "../../ConversationThread";
import { FollowUpComposer } from "../../FollowUpComposer";
import { PageShell } from "../../PageShell";
import { ScanCameraSurface } from "../../ScanCameraSurface";
import { StagedStepHeader } from "../../StagedStepHeader";

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
};

export function QuickLookupApp({ onSubmit }: QuickLookupAppProps): JSX.Element {
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
    startOver
  } = useAskAiSubmitOrchestration({
    apiBaseUrl,
    retryCooldownSeconds: RETRY_COOLDOWN_SECONDS
  });

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
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    questionContainerRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
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
  }

  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const frozenLookupCard =
    frozenContext?.kind === "lookup" ? frozenContext.card : null;

  if (isConversationActive) {
    return (
      <PageShell>
        <StagedStepHeader stepName="Quick Question" />

        {frozenLookupCard && (
          <CardSelectionPreview
            card={frozenLookupCard}
            contextTitle="Lookup card"
            contextContent={null}
            showContextSection={false}
          />
        )}

        <ConversationThread messages={visibleMessages} />

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

        <FollowUpComposer isSubmitting={isFollowUpSubmitting} onSubmit={submitFollowUp} />

        {!isSubmitting && !isFollowUpSubmitting && (
          <button
            type="button"
            onClick={handleStartOver}
            className="rounded-xl border border-zinc-500 bg-zinc-800/70 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
          >
            Start Over
          </button>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      {!scanCapture.isOpen && (
        <>
          <StagedStepHeader stepName="Quick Question" />
          <p className="text-sm text-zinc-400">
            Add a card for context or ask any Magic related question.
          </p>
        </>
      )}

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
              Optional card
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

          <form
            ref={questionContainerRef}
            onSubmit={handleSubmit}
            className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
          >
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
            <textarea
              ref={questionInputRef}
              id="quick-lookup-question"
              aria-label="Magic question"
              value={question}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-h-28 w-full resize-y rounded-xl border border-zinc-600 bg-zinc-800/80 px-3 py-2 text-sm normal-case tracking-normal text-zinc-100"
              placeholder={
                lockedTopic
                  ? "Add anything specific — or leave this blank and just ask."
                  : "What would you like to know?"
              }
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">{composedQuestion.length}/{MAX_QUESTION_LENGTH}</p>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Asking…" : "Ask TheJudge"}
              </button>
            </div>
          </form>

          {isSubmitting && <AskAiWaitingPanel isSubmitting={isSubmitting} />}

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
