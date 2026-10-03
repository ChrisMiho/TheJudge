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
import { useInDepthCarry } from "../../../lib/portal/inDepthCarryContext";
import { useAssistantSeed } from "../../../lib/portal/seedContext";
import { NO_MATCH_COPY } from "../../../lib/search";
import { MAX_LOOKUP_CARDS } from "../../../lib/stackLimits";
import type { CardMetadataItem } from "../../../types";
import { AskAiWaitingPanel } from "../../AskAiWaitingPanel";
import { CardDetailPopup } from "../../CardPresentation";
import { CardStage } from "../../CardStage";
import { getCardIdentityRingStyle } from "../../../lib/cardIdentityRing";
import { ComposerPill } from "../../ComposerPill";
import { ConversationWorkspace } from "../../ConversationWorkspace";
import { PageShell } from "../../PageShell";
import { ScanCameraSurface } from "../../ScanCameraSurface";
import { ScanReviewBubble } from "../../ScanReviewBubble";
import { StagedStepHeader } from "../../StagedStepHeader";

const FLOW_LABEL = "Quick Question";
const PAGE_TITLE = "Ask a Question";

const CARD_METADATA_URL = "/data/cardMetadata.json";
/** REQ-167: Ask a Question's Add-card search lists matches from the first character typed. The
 * mockup's own search (`quick-question.html`'s `renderSearch`) has no minimum — it filters its demo
 * shortlist on whatever is typed — and the real corpus has tens of thousands of cards, so an empty
 * box lists nothing. Every other card search keeps three (`DEFAULT_MIN_QUERY_LENGTH`). */
const ADD_CARD_MIN_QUERY_LENGTH = 1;
const MAX_QUESTION_LENGTH = 300;
/** The hint shortens in tiers as the box narrows (the mockup's `data-placeholders`). */
const QUESTION_PLACEHOLDER_TIERS = ["What would you like to know?", "Ask your question…", "Ask…"];
const RETRY_COOLDOWN_SECONDS = 13;

/**
 * The silent fallback question when only card(s) are attached and no typed
 * text exists. A single card renders exactly as before
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
      <span aria-hidden="true" className="thumb-fallback">
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

export type QuickLookupAppProps = {
  onSubmit?: (question: string, cards: CardMetadataItem[]) => void;
  isActive?: boolean;
};

export function QuickLookupApp({ onSubmit, isActive = true }: QuickLookupAppProps): JSX.Element {
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);
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
  const closeScanRef = useRef<() => void>(() => undefined);
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

    const hasStaging = selectedCards.length > 0 || question.trim().length > 0;

    if (hasStaging) {
      saveDraft({ mode: "lookup", selectedCards, question });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts only to selectedCards; question is read via closure at fire time inside snapshotMidFlightDraft.
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

    void loadCardMetadata();

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
    query: searchInput,
    minQueryLength: ADD_CARD_MIN_QUERY_LENGTH
  });
  const keyboard = useAutocompleteKeyboard({
    query: searchInput,
    suggestions,
    onSelect: selectCard,
    minQueryLength: ADD_CARD_MIN_QUERY_LENGTH
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
    normalizedSearchLength >= ADD_CARD_MIN_QUERY_LENGTH &&
    (isMetadataLoading || keyboard.isOpen || suggestions.length === 0);
  const trimmedQuestion = question.trim();
  const composedQuestion = trimmedQuestion || composeCardsFallbackQuestion(selectedCards);
  const hasQuestionContent = selectedCards.length > 0 || trimmedQuestion.length > 0;
  // The counter, the textarea cap, and this gate all measure the raw editable text.
  // `composedQuestion` may legitimately exceed the cap when the silent card fallback
  // names several cards, and that composed string is what gets submitted.
  const canSubmit = hasQuestionContent && question.length <= MAX_QUESTION_LENGTH;

  async function submitLookup(source: "decrypt" | "retry"): Promise<void> {
    if (!canSubmit) return;
    const payload = buildLookupAskAiRequest(composedQuestion, selectedCards);
    await submitAttempt({
      source,
      payload,
      stackSize: 0,
      finalQuestion: payload.question,
      usedFallbackQuestion: trimmedQuestion.length === 0 && selectedCards.length > 0
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
    setSelectedCards([]);
    setCardLimitMessage(null);
    setSearchInput("");
    setActiveConversationId(null);
    setReopenedFromHistory(false);
    closeScanRef.current();
  }

  // REQ-206: ✎ Edit cards returns to the pre-submit page with the cards and question
  // exactly as they were — the conversation is already saved to history (every successful
  // answer auto-saves via onConversationUpdated above, REQ-103), so only the in-progress
  // thread itself is cleared. Unlike Start Over, the cards/question staging is
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
        <section className="chat" aria-label="Conversation">
          <div className="chat-head">
            <h1>{PAGE_TITLE}</h1>
            {!isSubmitting && !isFollowUpSubmitting && (
              <div className="tools">
                <button
                  type="button"
                  onClick={handleEditCards}
                  title="Change the cards or the question, then ask again"
                  className="icon-chip"
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
                  className="icon-round"
                >
                  <span aria-hidden="true">↺</span>
                </button>
              </div>
            )}
          </div>
          {/* REQ-213/FLOW-016: reopened from Question History, not a fresh submit. */}
          {reopenedFromHistory && (
            <p className="from-history">
              <span>
                <span className="glyph" aria-hidden="true">
                  ◷
                </span>{" "}
                Reopened from your history
              </span>
            </p>
          )}

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
                  className="thumb tap card-identity-ring"
                  style={getCardIdentityRingStyle(cardMetadata.find((entry) => entry.cardId === card.cardId)?.colors)}
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
        </section>
      </PageShell>
    );
  }

  return (
    // Requirement 7: while scanning, this screen takes the same `100dvh`
    // fit Trade Balancer's scale screen uses (slice O), at the narrow 36rem
    // width instead of wide-fit's 56rem — the non-scanning state keeps
    // plain "narrow" (it scrolls by design).
    <PageShell variant={scanCapture.isOpen ? "narrow-fit" : "narrow"}>
      {/* Look-matching pass (slice P), requirement 1 (deviation from this
          slice's own files-touched list — see slice-p.evidence.md): the
          header and mock-mode strip now stay visible while scanning, instead
          of unmounting (the only repro LOOK-GAPS found for "the build hides
          the header and brand entirely" was this screen's own scan entry).
          The row under it swaps to the scanner's own title + exit
          (`card-scan.html:21-23`'s `.flow-head`) in place of "Ask a
          Question" + Add card/Scan while the camera is open. */}
      <StagedStepHeader />
      {scanCapture.isOpen ? (
        <div className="idq">
          <div className="flow-head">
            <h1>Scan a card</h1>
            <button type="button" aria-label="Exit scan" onClick={scanCapture.closeScan} className="scan-exit">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <section>
            {scanCapture.isLoading ? (
              <p className="aq-note">Loading scan data...</p>
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
            {scanCapture.error && <p className="motion-error aq-error">{scanCapture.error}</p>}
          </section>
        </div>
      ) : (
        <section className="qq" data-searching={isSearchOpen ? "true" : "false"}>
          <div className="flow-head">
            <h1>{PAGE_TITLE}</h1>
            <div className="attach">
              {/* The chip toggles the card search. While search is open it also hides the
                  card carousel on mobile (`flow.css` `[data-searching="true"] .stage`), so the
                  label/glyph flip to "✕ Close search" — the only hint that tapping it again
                  closes search and brings the carousel back. */}
              <button
                type="button"
                onClick={toggleSearch}
                aria-expanded={isSearchOpen}
                aria-controls="aq-search-pop"
                className="icon-chip"
              >
                <span className="glyph" aria-hidden="true">
                  {isSearchOpen ? "✕" : "＋"}
                </span>
                {isSearchOpen ? "Close search" : "Add card"}
              </button>
              <button
                type="button"
                aria-label="Scan a card"
                onClick={() => void scanCapture.openScan()}
                disabled={selectedCards.length >= MAX_LOOKUP_CARDS}
                className="icon-chip"
              >
                <span className="glyph" aria-hidden="true">
                  ▣
                </span>
                Scan
              </button>
            </div>
          </div>

          {selectedCards.length > 0 && <CardStage cards={selectedCards} cap={MAX_LOOKUP_CARDS} onRemove={removeCard} />}
          {selectedCards.length > 0 && (
            <div className="strip" aria-label="Attached cards">
              {selectedCards.map((card) => (
                <span
                  key={card.cardId}
                  className="thumb card-identity-ring"
                  style={getCardIdentityRingStyle(card.colors)}
                >
                  <CardThumbImage card={card} />
                </span>
              ))}
              <span className="note">{`${selectedCards.length} of ${MAX_LOOKUP_CARDS} attached`}</span>
            </div>
          )}

          {/* Look-matching pass (slice M), requirement 7: the search opens above the
              composer, inside this shared `.composer` wrapper (`flow.css:187`
              `quick-question.html:53-71`) — independent of the submit state below, so
              searching for another card stays available while an answer is loading,
              exactly as the always-visible panel it replaces did. */}
          <div className="composer">
            {isSearchOpen && (
              <section className="search-pop open" id="aq-search-pop" aria-label="Add a card">
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
                      <p className="aq-note">Loading cards...</p>
                    ) : suggestions.length === 0 ? (
                      <p className="aq-note">{NO_MATCH_COPY}</p>
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

                {metadataError && <p className="aq-note">{metadataError}</p>}
                {cardLimitMessage && <p className="aq-note">{cardLimitMessage}</p>}
              </section>
            )}

            {isSubmitting ? (
              <AskAiWaitingPanel isSubmitting={isSubmitting} />
            ) : (
              <>
                <ComposerPill
                  value={question}
                  onChange={setQuestion}
                  onSubmit={handleSubmit}
                  maxLength={MAX_QUESTION_LENGTH}
                  textareaId="quick-lookup-question"
                  textareaRef={questionInputRef}
                  textareaAriaLabel="Magic question"
                  placeholder="What would you like to know?"
                  placeholders={QUESTION_PLACEHOLDER_TIERS}
                  submitLabel="Ask TheJudge"
                  pendingLabel="Asking…"
                  isSubmitting={isSubmitting}
                  disabled={!canSubmit}
                  onAddInDepthDetails={handleCarryToInDepth}
                />
              </>
            )}
          </div>

          {error && (
            <div className="motion-error aq-error">
              <p>{error}</p>
              <button type="button" className="btn" disabled={!canRetry} onClick={() => void submitLookup("retry")}>
                {retryLabel}
              </button>
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}
