import { useEffect, useRef, useState } from "react";
import { useAutocompleteKeyboard } from "../../../hooks/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "../../../hooks/useAutocompleteSuggestions";
import { useAskAiSubmitOrchestration } from "../../../hooks/useAskAiSubmitOrchestration";
import { useAutoGrowTextarea } from "../../../hooks/useAutoGrowTextarea";
import { useScanCapture, type ScanHoldCheck } from "../../../hooks/useScanCapture";
import { buildLookupAskAiRequest } from "../../../lib/contextFlow";
import type { LookupDraftState } from "../../../lib/conversationHistory/persistence";
import {
  clearDraft,
  loadDraft,
  loadHistoryEntries,
  saveDraft,
  saveHistoryEntry
} from "../../../lib/conversationHistory/persistence";
import { apiBaseUrl } from "../../../lib/env";
import { deriveCardImageUrl } from "../../../lib/cardImage";
import { prefersReducedMotion } from "../../../lib/motionPreference";
import { useInDepthCarry } from "../../../lib/portal/inDepthCarryContext";
import { useAssistantSeed } from "../../../lib/portal/seedContext";
import { NO_MATCH_COPY } from "../../../lib/search";
import { MAX_LOOKUP_CARDS } from "../../../lib/stackLimits";
import type { CardMetadataItem } from "../../../types";
import { AskAiWaitingPanel } from "../../AskAiWaitingPanel";
import { CardDetailPopup } from "../../CardPresentation";
import { CardStage } from "../../CardStage";
import { ComposerPill } from "../../ComposerPill";
import { ConversationWorkspace } from "../../ConversationWorkspace";
import { PageShell } from "../../PageShell";
import { ScanCameraSurface } from "../../ScanCameraSurface";
import { ScanReviewBubble } from "../../ScanReviewBubble";
import { StagedStepHeader } from "../../StagedStepHeader";

const FLOW_LABEL = "Quick Question";
const PAGE_TITLE = "Ask a Question";

const CARD_METADATA_URL = "/data/cardMetadata.json";
const CORE_TOPICS_URL = "/data/gameRulesCoreTopics.json";
const MAX_QUESTION_LENGTH = 300;
const RETRY_COOLDOWN_SECONDS = 13;

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

/** Look-matching pass (slice M): the CARDS strip thumbnail (`flow.css:351` `.chat-cards
 * .thumb`) and the card-search result row thumbnail (`flow.css:181` `.search-results
 * .thumb`) share the same small image-or-initial fallback, sized by their own CSS class. */
function CardThumbImage({ card }: { card: { name: string; imageUrl?: string; imageId?: string } }): JSX.Element {
  const imageUrl = card.imageUrl?.trim() || deriveCardImageUrl(card.imageId) || undefined;
  if (!imageUrl) {
    return (
      <span
        aria-hidden="true"
        className="flex h-full w-full items-center justify-center bg-zinc-800 text-[6px] font-semibold text-zinc-300"
      >
        {card.name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return <img src={imageUrl} alt="" />;
}

function ChatCardThumb({ card }: { card: { name: string; imageUrl?: string; imageId?: string } }): JSX.Element {
  return <CardThumbImage card={card} />;
}

function SearchResultThumb({ card }: { card: CardMetadataItem }): JSX.Element {
  return (
    <span className="thumb" aria-hidden="true">
      <CardThumbImage card={card} />
    </span>
  );
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
  // Look-matching pass (slice M): the card search collapses into the composer's own
  // "＋ Add card" chip (`flow.css:169-182` `.search-pop`) instead of a permanent panel
  // (requirement 1). It is a manual toggle only — it does not auto-close on a successful
  // add, unlike the mockup's own demo script — so attaching several cards in a row (REQ-167's
  // up-to-10 workflow, already shipped by slice C) still takes one open, not one open per card.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<CardMetadataItem[]>([]);
  const [cardLimitMessage, setCardLimitMessage] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [lockedTopic, setLockedTopic] = useState<Pick<CoreTopic, "id" | "title"> | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const closeScanRef = useRef<() => void>(() => undefined);
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  // REQ-213/FLOW-016: set when the active conversation was reached by resuming it from
  // Question History rather than a fresh submit, so the thread can say so under the title.
  const [reopenedFromHistory, setReopenedFromHistory] = useState(false);
  // Look-matching pass (slice M): focused by the effect below the moment the "＋ Add
  // card" chip opens its popover (requirement 1).
  const searchInputRef = useRef<HTMLInputElement>(null);
  // REQ-075/REQ-206: a card-name chip in the ruling opens that card's detail.
  const [chipDetailCardId, setChipDetailCardId] = useState<string | null>(null);
  const { goToInDepthDetails } = useInDepthCarry();
  const { consumeHistoryResume, consumeHistoryDeletion, consumeDraftResume, historyResumeVersion } = useAssistantSeed();
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

  // REQ-213/FLOW-016/FLOW-017/FLOW-018: Question History now lives one level up
  // (FeaturePortalMenu's combined sheet), so this destination's own exits for it are a
  // mailbox it consumes rather than local drawer state. `historyResumeVersion` is the one
  // reactive signal covering all three mailboxes — each `consume*` call below is mode-aware
  // and a no-op when nothing matching "lookup" is pending, so this effect is safe to run on
  // every bump regardless of which flow (or neither) the player actually acted on.
  useEffect(() => {
    const resumeEntry = consumeHistoryResume("lookup");
    if (resumeEntry) {
      // Opening a saved conversation is the third mid-flight exit (DEC-138), alongside
      // Menu-leave and reload. Snapshot first, then restore, so a staged attempt reappears
      // as this flow's own Draft row the next time History opens. Silent by design.
      snapshotMidFlightDraft();
      restoreConversation(resumeEntry);
      setActiveConversationId(resumeEntry.id);
      setReopenedFromHistory(true);
      return;
    }

    const deletedId = consumeHistoryDeletion("lookup");
    if (deletedId && deletedId === activeConversationId) {
      handleStartOver();
      return;
    }

    if (consumeDraftResume("lookup")) {
      const draft = loadDraft("lookup");
      if (draft) hydrateFromLookupDraft(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts only to historyResumeVersion; the consume*/activeConversationId/handleStartOver/restoreConversation values are read via closure at fire time, not listed, so an unrelated render doesn't re-run this.
  }, [historyResumeVersion]);

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

  const isFirstCardsEffectRef = useRef(true);

  // REQ-206 owner edit (A4/A5): the Draft begins the moment the first card is attached —
  // not only once the player leaves the Menu or types a question — so a carried-but-
  // unplaced card survives a reload. Reacts to every `selectedCards` change (attach or
  // remove) rather than typing, which still relies on the Menu-leave snapshot above; the
  // very first effect pass is skipped so it never races the mount-hydrate effect above (a
  // snapshot here, before that effect's own `setSelectedCards` commits, would read the
  // pre-hydration empty array and wipe the very draft about to be restored).
  useEffect(() => {
    if (isFirstCardsEffectRef.current) {
      isFirstCardsEffectRef.current = false;
      return;
    }
    snapshotMidFlightDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts only to selectedCards; question/lockedTopic are read via closure at fire time inside snapshotMidFlightDraft.
  }, [selectedCards]);

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

  function closeSearch(): void {
    setIsSearchOpen(false);
  }

  function toggleSearch(): void {
    setIsSearchOpen((open) => !open);
  }

  // Focuses the card-search field the moment its popover mounts (requirement 1's "＋ Add
  // card" chip opens it) — matching the pre-slice-M behaviour, where the same button
  // focused the already-mounted, always-visible field.
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const suggestions = useAutocompleteSuggestions({
    cards: cardMetadata,
    query: searchInput
  });
  const keyboard = useAutocompleteKeyboard({
    query: searchInput,
    suggestions,
    onSelect: selectCard
  });
  // REQ-214: the hold-time duplicate/cap check — the same rule the immediate
  // add always ran, applied the instant a card is recognised rather than
  // deferred to commit, so a blocked re-scan or a cap hit still surfaces its
  // message right away. Checked against the staged cards *and* anything
  // already in the holding list but not yet committed.
  function canHoldLookupCard(card: CardMetadataItem, held: { card: CardMetadataItem }[]): ScanHoldCheck {
    const alreadyStaged =
      selectedCards.some((existing) => existing.cardId === card.cardId) ||
      held.some((entry) => entry.card.cardId === card.cardId);
    if (alreadyStaged) {
      const message = `${card.name} is already attached to this question.`;
      setCardLimitMessage(message);
      return { ok: false, message };
    }
    if (selectedCards.length + held.length >= MAX_LOOKUP_CARDS) {
      const message = `You've added ${MAX_LOOKUP_CARDS} cards, the most one Quick Question can use. Remove a card below to add another.`;
      setCardLimitMessage(message);
      return { ok: false, message };
    }
    setCardLimitMessage(null);
    return { ok: true };
  }

  const scanCapture = useScanCapture({
    cardMetadata,
    canHold: canHoldLookupCard,
    // REQ-214: invoked once per held card when the scanner closes, in hold order —
    // scanning no longer auto-exits after one card; the player can scan up to the
    // lookup cap before closing, same as In-depth's zones and Trade Balancer.
    onScanCandidateSelected: (card) => {
      const outcome = addLookupCard(card);
      setCardLimitMessage(outcome.added ? null : outcome.message);
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
  const hasQuestionContent = lockedTopic !== null || selectedCards.length > 0 || trimmedQuestion.length > 0;
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
      usedFallbackQuestion: lockedTopic === null && trimmedQuestion.length === 0 && selectedCards.length > 0
    });
  }

  function handleSubmit(): void {
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
    setReopenedFromHistory(false);
    closeScanRef.current();
  }

  // REQ-206: ✎ Edit cards returns to the pre-submit page with the cards and question
  // exactly as they were — the conversation is already saved to history (every successful
  // answer auto-saves via onConversationUpdated above, REQ-103), so only the in-progress
  // thread itself is cleared. Unlike Start Over, the cards/question/locked-topic staging is
  // left untouched.
  function handleEditCards(): void {
    startOver();
    setActiveConversationId(null);
    setReopenedFromHistory(false);
  }

  // REQ-206: Add in-depth details carries every attached card and the typed question (or
  // its silent fallback) into In-depth details. PortalShell (`goToInDepthDetails`) owns the
  // navigation and the Life-Tracker roster-seed check; this page only hands over what it
  // has — it is not consumed yet (In-depth details' Cards shelf, slice D).
  function handleCarryToInDepth(): void {
    goToInDepthDetails(selectedCards, trimmedQuestion || composedQuestion);
  }

  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const frozenLookupCards = frozenContext?.kind === "lookup" ? frozenContext.cards : [];
  useAutoGrowTextarea(question, questionInputRef);

  if (isConversationActive) {
    return (
      <PageShell variant="narrow">
        <StagedStepHeader />
        <div className="chat-head">
          <h1>{PAGE_TITLE}</h1>
          {!isSubmitting && !isFollowUpSubmitting && (
            <div className="tools">
              <button
                type="button"
                onClick={handleEditCards}
                title="Change the cards or the question, then ask again"
                className="icon-chip motion-focus"
              >
                <span className="glyph" aria-hidden="true">
                  ✎
                </span>
                Edit cards
              </button>
              <button
                type="button"
                onClick={handleStartOver}
                aria-label="Start over — clears the cards and the question"
                title="Start over — clears the cards and the question"
                className="chat-icon-round motion-focus"
              >
                <span aria-hidden="true">↺</span>
              </button>
            </div>
          )}
        </div>
        {/* REQ-213/FLOW-016: reopened from Question History, not a fresh submit. */}
        {reopenedFromHistory && <p className="text-xs text-zinc-400">Reopened from your history</p>}

        {/* Look-matching pass (slice M), requirement 11: the CARDS thumbnail strip
            (`flow.css:345-352` `.chat-cards`) replaces the "VIEW CONTEXT · N cards" panel on
            this screen — that panel belongs to In-depth details only (slice N). A tap opens
            the same corner `CardDetailPopup` the stage and the search results use. */}
        {frozenLookupCards.length > 0 && (
          <div className="chat-cards">
            <span className="lbl">Cards</span>
            {frozenLookupCards.map((card) => (
              <button
                key={card.cardId}
                type="button"
                className="thumb tap motion-focus"
                aria-label={`View ${card.name}`}
                onClick={() => setChipDetailCardId(card.cardId)}
              >
                <ChatCardThumb card={card} />
              </button>
            ))}
          </div>
        )}

        {chipDetailCardId &&
          (() => {
            const chipCard = frozenLookupCards.find((card) => card.cardId === chipDetailCardId);
            return chipCard ? <CardDetailPopup card={chipCard} onClose={() => setChipDetailCardId(null)} /> : null;
          })()}

        <ConversationWorkspace
          messages={visibleMessages}
          cards={frozenLookupCards}
          onCardChipActivate={setChipDetailCardId}
          error={error}
          canRetry={canRetry}
          retryLabel={retryLabel}
          onRetry={() => submitLookup("retry")}
          isFollowUpSubmitting={isFollowUpSubmitting}
          onFollowUp={submitFollowUp}
          onStartOver={handleStartOver}
          // The round ↺ in the head above now carries Start Over (requirement 11);
          // the old text button under the follow-up box is retired.
          showStartOver={false}
        />
      </PageShell>
    );
  }

  return (
    <PageShell variant="narrow">
      {!scanCapture.isOpen && (
        <>
          <StagedStepHeader />
          <div className="flow-head">
            <h1>{PAGE_TITLE}</h1>
            <div className="attach">
              <button
                type="button"
                onClick={toggleSearch}
                aria-expanded={isSearchOpen}
                aria-controls="aq-search-pop"
                className="icon-chip motion-focus"
              >
                <span className="glyph" aria-hidden="true">
                  ＋
                </span>
                Add card
              </button>
              <button
                type="button"
                aria-label="Scan a card"
                onClick={() => void scanCapture.openScan()}
                disabled={selectedCards.length >= MAX_LOOKUP_CARDS}
                className="icon-chip motion-focus"
              >
                <span className="glyph" aria-hidden="true">
                  ▣
                </span>
                Scan
              </button>
            </div>
          </div>
        </>
      )}

      {scanCapture.isOpen ? (
        <section className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-3">
          {scanCapture.isLoading ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300">
              Loading scan data...
            </p>
          ) : (
            <div className="relative">
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
              {/* REQ-214: a box with an ✕ above the camera's top-right corner — the only
                  way out; closing commits the holding list below to this question. */}
              <button
                type="button"
                aria-label="Exit scan"
                onClick={scanCapture.closeScan}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-950/70 text-sm font-semibold text-zinc-200 shadow transition hover:bg-zinc-800"
              >
                <span aria-hidden="true">✕</span>
              </button>
              <ScanReviewBubble
                entries={scanCapture.heldEntries.map((entry) => ({
                  id: entry.id,
                  card: { cardId: entry.card.cardId, name: entry.card.name, imageUrl: entry.scanImageUrl },
                  colors: entry.card.colors
                }))}
                onRemove={scanCapture.removeHeld}
                destinationLabel="your question"
              />
            </div>
          )}
          {scanCapture.error && (
            <p className="motion-error rounded-xl border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {scanCapture.error}
            </p>
          )}
        </section>
      ) : (
        <>
          {selectedCards.length > 0 && <CardStage cards={selectedCards} cap={MAX_LOOKUP_CARDS} onRemove={removeCard} />}

          {/* Look-matching pass (slice M), requirement 7: the search opens above the
              composer, inside this shared `.composer` wrapper (`flow.css:187`
              `quick-question.html:53-71`) — independent of the submit state below, so
              searching for another card stays available while an answer is loading,
              exactly as the always-visible panel it replaces did. */}
          <div className="composer">
            {isSearchOpen && (
              <section className="search-pop" id="aq-search-pop" aria-label="Add a card">
                <div className="search-row">
                  <span className="glyph" aria-hidden="true">
                    ⌕
                  </span>
                  <input
                    ref={searchInputRef}
                    aria-label="Card search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        closeSearch();
                        return;
                      }
                      keyboard.handleKeyDown(event);
                    }}
                    className="field"
                    placeholder="Search for a card to add"
                    autoComplete="off"
                  />
                </div>

                {showSuggestionPanel && (
                  <div className="search-results">
                    {isMetadataLoading ? (
                      <p className="px-2 py-1 text-sm text-zinc-400">Loading cards...</p>
                    ) : suggestions.length === 0 ? (
                      <p className="px-2 py-1 text-sm text-zinc-400">{NO_MATCH_COPY}</p>
                    ) : (
                      suggestions.map((card, index) => (
                        <button
                          key={card.cardId}
                          type="button"
                          data-active={keyboard.activeIndex === index}
                          onClick={() => {
                            selectCard(card);
                            keyboard.closeSuggestions();
                          }}
                          onMouseEnter={() => keyboard.setActiveIndex(index)}
                        >
                          <SearchResultThumb card={card} />
                          <span>{card.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {metadataError && <p className="text-sm text-amber-200">{metadataError}</p>}
                {cardLimitMessage && <p className="text-sm text-amber-200">{cardLimitMessage}</p>}
              </section>
            )}

            {isSubmitting ? (
              <AskAiWaitingPanel isSubmitting={isSubmitting} />
            ) : (
              <div ref={questionContainerRef} className="space-y-2">
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
                <ComposerPill
                  value={question}
                  onChange={setQuestion}
                  onSubmit={handleSubmit}
                  maxLength={MAX_QUESTION_LENGTH}
                  textareaId="quick-lookup-question"
                  textareaRef={questionInputRef}
                  textareaAriaLabel="Magic question"
                  placeholder={
                    lockedTopic
                      ? "Add anything specific — or leave this blank and just ask."
                      : "What would you like to know?"
                  }
                  submitLabel="Ask TheJudge"
                  pendingLabel="Asking…"
                  isSubmitting={isSubmitting}
                  disabled={!canSubmit}
                  onAddInDepthDetails={handleCarryToInDepth}
                />
              </div>
            )}
          </div>

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
                        setOpenTopicId((currentTopicId) => (currentTopicId === topic.id ? null : currentTopicId));
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
