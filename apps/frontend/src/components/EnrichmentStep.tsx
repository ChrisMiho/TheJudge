import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { buildEnrichmentQueue, CANONICAL_ZONE_ORDER, resolveFallbackQuestion } from "../lib/contextFlow";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { fetchCardDetail, peekCardDetail } from "../lib/cardDetail";
import { formatContextTarget, formatPrintedManaHint, hasOwnerControl, parseManaSpent } from "../lib/enrichmentFormat";
import { buildPlayerDisplayNameMap, formatPlayerDisplayLabel } from "../lib/playerLabels";
import { ZONE_LABELS } from "../lib/zoneLabels";
import { useAutoGrowTextarea } from "../hooks/useAutoGrowTextarea";
import { ComposerPill } from "./ComposerPill";
import {
  TARGET_OPTION_ALL_PLAYERS,
  TARGET_OPTION_BOARD,
  TARGET_OPTION_CUSTOM,
  TARGET_OPTION_NONE,
  useEnrichmentTargets
} from "../hooks/useEnrichmentTargets";
import type { ConversationMessage, GameContext, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
import { AdaptiveContextDialog } from "./AdaptiveContextDialog";
import { AskAiWaitingPanel } from "./AskAiWaitingPanel";
import { CardHero } from "./CardHero";
import type { ConversationHistoryTriggerDescriptor } from "./ConversationWorkspace";
import { ConversationWorkspace } from "./ConversationWorkspace";
import { FrozenGameContextDetails, getFrozenGameContextTriggerLabel } from "./FrozenGameContextDetails";
import { PageShell } from "./PageShell";
import { SheetShell } from "./SheetShell";
import { StagedStepHeader } from "./StagedStepHeader";

const MAX_COPIES = 99;

const MAX_QUESTION_CHARS = 300;

type ContextCardEntry = { zone: ZoneId; cardId: string; cardName: string };

type EnrichmentStepProps = {
  gameContext: GameContext | null;
  zones: Partial<Record<ZoneId, ZoneCardItem[]>>;
  onZonesChange: (zones: Partial<Record<ZoneId, ZoneCardItem[]>>) => void;
  activePlayers: PlayerLabel[];
  question: string;
  onQuestionChange: (q: string) => void;
  onDecryptStack: (event: FormEvent) => Promise<void>;
  /** Look-matching pass (slice N), requirement 3: no longer rendered as a per-step
   * "Back to zones" button — the caller's shared header ‹ is the only way back now.
   * Kept in the prop contract so `MtgAssistantApp`'s wiring is unchanged. */
  onBack: () => void;
  canDecrypt: boolean;
  isSubmitting: boolean;
  answer: string | null;
  error: string | null;
  canRetry: boolean;
  retryCountdown: number;
  onRetry: () => Promise<void>;
  statusMessage: string | null;
  isConversationActive: boolean;
  isFollowUpSubmitting: boolean;
  visibleMessages: ConversationMessage[];
  frozenGameContext: GameContext | null;
  onFollowUp: (text: string) => Promise<void>;
  onStartOver: () => void;
  /** REQ-209: the ruling's ✎ Edit — back to the review with everything kept; the caller clears
   * only the answered thread (already saved to Question History), never the staged context. */
  onEditRequest: () => void;
  historyTrigger?: ConversationHistoryTriggerDescriptor;
  /** REQ-209: the four-station progress rail. Rendered only on the staged Context form —
   * "the ruling is not a station; when it arrives the rail and flow give way to the chat." */
  stationsRail?: ReactNode;
};

export function EnrichmentStep({
  gameContext,
  zones,
  onZonesChange,
  activePlayers,
  question,
  onQuestionChange,
  onDecryptStack,
  canDecrypt,
  isSubmitting,
  answer,
  error,
  canRetry,
  retryCountdown,
  onRetry,
  statusMessage,
  isConversationActive,
  isFollowUpSubmitting,
  visibleMessages,
  frozenGameContext,
  onFollowUp,
  onStartOver,
  onEditRequest,
  historyTrigger,
  stationsRail
}: EnrichmentStepProps): JSX.Element {
  // REQ-017/REQ-045: the former "View all cards" / "Card-by-card" toggle and its list
  // mode are retired — the Context station always shows one compact sheet per card,
  // in order, with a review (not a second list mode) once every card is reviewed.
  const [cardIndex, setCardIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  // Look-matching pass (slice N), requirement 9: the review plate's own "Collapse ▴"
  // toggle and zone filter pills — presentation-only, no effect on the data submitted.
  const [reviewCollapsed, setReviewCollapsed] = useState(false);
  const [reviewZoneFilter, setReviewZoneFilter] = useState<ZoneId | null>(null);
  // Look-matching pass (slice N), requirement 9: "N cards · scroll the list for the
  // rest" (`in-depth-question.html:1072` `markReviewScroll()`) shows only once the
  // list's own content is actually taller than its capped-height box.
  const reviewListRef = useRef<HTMLDivElement>(null);
  const [reviewListOverflowing, setReviewListOverflowing] = useState(false);
  const [cardAnimKey, setCardAnimKey] = useState(0);
  const [noteOpenByKey, setNoteOpenByKey] = useState<Record<string, boolean>>({});
  // REQ-210: once a player edits Mana spent, the box shows exactly what they typed —
  // including empty, mid-edit — instead of snapping back to the printed-value prefill.
  // `manaSpent` alone can't carry that distinction (undefined means both "never
  // touched" and "cleared"), so the raw text is tracked separately per card and only
  // consulted once the player has actually typed in that card's box.
  const [manaSpentDraftByKey, setManaSpentDraftByKey] = useState<Record<string, string>>({});
  // REQ-211: the Stack-only More details sheet (today's one rare setting: Copies).
  // One at a time, keyed by the card's own cardKey so it never opens over the wrong card.
  const [moreDetailsOpenKey, setMoreDetailsOpenKey] = useState<string | null>(null);

  const enrichmentQueue = useMemo(
    () => (gameContext ? buildEnrichmentQueue({ ...gameContext, zones }) : []),
    [gameContext, zones]
  );
  const displayNamesByPlayer = useMemo(
    () => buildPlayerDisplayNameMap(gameContext?.players ?? []),
    [gameContext?.players]
  );

  const contextIndex = useMemo((): ContextCardEntry[] => {
    const entries: ContextCardEntry[] = [];
    for (const zoneId of CANONICAL_ZONE_ORDER) {
      for (const card of zones[zoneId] ?? []) {
        entries.push({ zone: zoneId, cardId: card.cardId, cardName: card.name });
      }
    }
    return entries;
  }, [zones]);

  const totalCards = enrichmentQueue.length;
  const currentEntry = enrichmentQueue[cardIndex];

  useEffect(() => {
    if (cardIndex >= totalCards && totalCards > 0) {
      setCardIndex(Math.max(totalCards - 1, 0));
    }
    if (totalCards === 0) {
      setReviewing(false);
      setCardIndex(0);
    }
  }, [totalCards, cardIndex]);

  useEffect(() => {
    const el = reviewListRef.current;
    if (!el) {
      setReviewListOverflowing(false);
      return;
    }
    setReviewListOverflowing(el.scrollHeight - el.clientHeight > 4);
  }, [reviewing, reviewCollapsed, reviewZoneFilter, zones, totalCards]);

  // REQ-210: the Mana spent box prefills with the printed mana value — the frontend
  // carries no `manaValue` on a `ZoneCardItem` (it is resolved server-side by cardId,
  // REQ-176), so this fetches the one currently-shown card's descriptive block
  // on demand, the same `GET /api/cards/:oracleId` path and session cache the card
  // detail popup already uses (REQ-175, FLOW-024) — no new endpoint.
  const [manaDetailByCardId, setManaDetailByCardId] = useState<
    Record<string, { manaCost: string; manaValue: number; typeLine: string } | null>
  >({});

  useEffect(() => {
    const cardId = currentEntry?.card.cardId;
    if (!cardId || cardId in manaDetailByCardId) return;

    const cached = peekCardDetail(cardId);
    if (cached !== undefined) {
      setManaDetailByCardId((m) => ({
        ...m,
        [cardId]: cached ? { manaCost: cached.manaCost, manaValue: cached.manaValue, typeLine: cached.typeLine } : null
      }));
      return;
    }

    let cancelled = false;
    fetchCardDetail(cardId)
      .then((detail) => {
        if (cancelled) return;
        setManaDetailByCardId((m) => ({
          ...m,
          [cardId]: detail
            ? { manaCost: detail.manaCost, manaValue: detail.manaValue, typeLine: detail.typeLine }
            : null
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setManaDetailByCardId((m) => ({ ...m, [cardId]: null }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEntry?.card.cardId]);

  function cardKey(zone: ZoneId, instanceId: string): string {
    return `${zone}:${instanceId}`;
  }

  function updateZoneCard(zone: ZoneId, instanceId: string, updates: Partial<ZoneCardItem>): void {
    const zoneCards = zones[zone] ?? [];
    const updated = zoneCards.map((c) => (c.instanceId === instanceId ? { ...c, ...updates } : c));
    onZonesChange({ ...zones, [zone]: updated });
  }

  const {
    pendingCustomTextByKey,
    setPendingCustomTextByKey,
    isAwaitingCustomTarget,
    handleSelectTargetOption,
    handleConfirmCustomTarget,
    handleCancelCustomTarget,
    handleRemoveTarget
  } = useEnrichmentTargets({ activePlayers, contextIndex, updateZoneCard });

  function goToCard(index: number): void {
    setReviewing(false);
    setCardIndex(index);
    setCardAnimKey((current) => current + 1);
  }

  function handleEditFromReview(zone: ZoneId, card: ZoneCardItem): void {
    const index = enrichmentQueue.findIndex(
      (entry) =>
        entry.zone === zone && (entry.card.instanceId ?? entry.card.cardId) === (card.instanceId ?? card.cardId)
    );
    if (index >= 0) goToCard(index);
  }

  // Look-matching pass (slice N), requirement 9: the review row's one-line summary
  // (`in-depth-question.html:1229-1239` `summarize()`) — "cast by X" / "X's", mana
  // spent only when the player actually set one, targets, and a quoted note.
  function summarizeReviewCard(zone: ZoneId, card: ZoneCardItem): string {
    const bits: string[] = [];
    if (zone === "stack") {
      const caster = card.caster ?? activePlayers[0] ?? "Player 1";
      bits.push(`cast by ${formatPlayerDisplayLabel(caster, displayNamesByPlayer[caster])}`);
    } else if (hasOwnerControl(zone)) {
      const owner = card.owner ?? activePlayers[0] ?? "Player 1";
      bits.push(`${formatPlayerDisplayLabel(owner, displayNamesByPlayer[owner])}’s`);
    }
    if (card.manaSpent !== undefined) {
      bits.push(`${card.manaSpent} mana spent`);
    }
    if (zone === "stack" && card.copies) {
      bits.push(`+${card.copies} ${card.copies === 1 ? "copy" : "copies"}`);
    }
    const targets = card.targets ?? [];
    if (targets.length === 1 && targets[0]!.kind === "none") {
      bits.push("no specific target");
    } else if (targets.length > 0) {
      bits.push(
        `targets ${targets
          .map((target) =>
            target.kind === "card" ? target.cardName : formatContextTarget(target, displayNamesByPlayer)
          )
          .join(", ")}`
      );
    }
    if (card.contextNotes) {
      bits.push(`“${card.contextNotes}”`);
    }
    return bits.join(" · ");
  }

  function handleNext(): void {
    if (cardIndex < totalCards - 1) {
      setCardIndex((current) => current + 1);
      setCardAnimKey((current) => current + 1);
      return;
    }
    setReviewing(true);
  }

  function renderCompactSheet(zone: ZoneId, card: ZoneCardItem): JSX.Element {
    const key = cardKey(zone, card.instanceId ?? card.cardId);
    const isStackZone = zone === "stack";
    const showsOwner = hasOwnerControl(zone);
    const manaDetail = manaDetailByCardId[card.cardId];
    const manaHint = formatPrintedManaHint({ manaCost: manaDetail?.manaCost, manaValue: manaDetail?.manaValue });
    const manaSpentDraft = manaSpentDraftByKey[key];
    const manaDisplayValue =
      manaSpentDraft !== undefined
        ? manaSpentDraft
        : card.manaSpent !== undefined
          ? String(card.manaSpent)
          : manaDetail?.manaValue !== undefined
            ? String(manaDetail.manaValue)
            : "";
    const noteOpen = noteOpenByKey[key] ?? Boolean(card.contextNotes);
    const otherCards = contextIndex.filter((entry) => !(entry.zone === zone && entry.cardId === card.cardId));
    const typeLine = manaDetail?.typeLine || card.typeLine;
    const printedCost = manaDetail?.manaCost || card.manaCost;
    const copies = card.copies ?? 0;

    return (
      <li key={key} className="enrichment-card-row enrichment-card-enter">
        {/* `in-depth-question.html`'s `#wizard-plate`: the card's art at the left (210px desktop,
            96px phone — REQ-017), the zone / name / counter head beside it, the form below. */}
        <div className="ctx-art">
          <CardHero card={card} />
        </div>
        <div className="ctx-head">
          <div className="eyebrow">
            <span>{ZONE_LABELS[zone]}</span>
            <button type="button" className="link" onClick={() => setReviewing(true)}>
              Skip to review
            </button>
          </div>
          <h2>{card.name}</h2>
          {typeLine ? (
            <div className="sub">
              {typeLine}
              {printedCost ? (
                <>
                  {" · "}
                  <span>{printedCost}</span>
                </>
              ) : null}
            </div>
          ) : null}
          {/* "Card N of M" stays as sr-only text so the existing getByText("Card N of M")
              assertions keep resolving — same information, carried visually by the badge. */}
          <span className="counter" aria-live="polite">
            <span aria-hidden="true">
              {cardIndex + 1}&nbsp;/&nbsp;{totalCards}
            </span>
            <small aria-hidden="true">cards</small>
            <span className="sr-only">
              Card {cardIndex + 1} of {totalCards}
            </span>
          </span>
        </div>

        <div className="ctx-form min-w-0">
          <div className="ctx-grid">
            {showsOwner && (
              <label>
                <span className="t">Owner</span>
                <select
                  aria-label={`Owner for ${card.name}`}
                  value={card.owner ?? gameContext?.activePlayer ?? activePlayers[0] ?? "Player 1"}
                  onChange={(e) =>
                    updateZoneCard(zone, card.instanceId ?? card.cardId, { owner: e.target.value as PlayerLabel })
                  }
                  className="field"
                >
                  {activePlayers.map((p) => (
                    <option key={p} value={p}>
                      {formatPlayerDisplayLabel(p, displayNamesByPlayer[p])}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {isStackZone && (
              <label>
                <span className="t">Cast by</span>
                <select
                  aria-label={`Caster for ${card.name}`}
                  value={card.caster ?? activePlayers[0] ?? "Player 1"}
                  onChange={(e) =>
                    updateZoneCard(zone, card.instanceId ?? card.cardId, { caster: e.target.value as PlayerLabel })
                  }
                  className="field"
                >
                  {activePlayers.map((p) => (
                    <option key={p} value={p}>
                      {formatPlayerDisplayLabel(p, displayNamesByPlayer[p])}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* REQ-210 (owner-edited): Mana spent is on every zone's card now, not only
                  the Stack, prefilled with the printed mana value; an untouched box leaves
                  `manaSpent` undefined so nothing is sent. */}
            <label>
              <span className="t">Mana spent{manaHint ? <small>{manaHint}</small> : null}</span>
              <input
                aria-label={`Mana spent for ${card.name}`}
                type="text"
                inputMode="numeric"
                value={manaDisplayValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  setManaSpentDraftByKey((c) => ({ ...c, [key]: raw }));
                  updateZoneCard(zone, card.instanceId ?? card.cardId, { manaSpent: parseManaSpent(raw) });
                }}
                placeholder="e.g. 3"
                className="field"
              />
            </label>
          </div>

          <div className="targets">
            <span className="lbl">
              <span className="t">
                Targets<small>leave blank if it has none</small>
              </span>
            </span>
            {/* Chosen targets sit above the picker as pills; a "card" target resolved against a
                zone list carries that card's thumbnail. */}
            {(card.targets ?? []).length > 0 && (
              <div className="target-list">
                {(card.targets ?? []).map((target, targetIndex) => {
                  const targetCard =
                    target.kind === "card" ? zones[target.zone]?.find((c) => c.cardId === target.cardId) : undefined;
                  return (
                    <span key={targetIndex} className="pill">
                      {targetCard?.imageUrl && (
                        <span
                          className="thumb card-identity-ring"
                          style={getCardIdentityRingStyle(targetCard.colors)}
                          aria-hidden="true"
                        >
                          <img src={targetCard.imageUrl} alt="" />
                        </span>
                      )}
                      {target.kind === "card" ? target.cardName : formatContextTarget(target, displayNamesByPlayer)}
                      <button
                        type="button"
                        aria-label={`Remove target ${targetIndex + 1} for ${card.name}`}
                        onClick={() => handleRemoveTarget(zone, card, targetIndex)}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <select
              aria-label={`Add a target for ${card.name}`}
              value=""
              onChange={(e) => handleSelectTargetOption(zone, card, key, e.target.value)}
              className="field"
            >
              <option value="" disabled>
                {(card.targets ?? []).length > 0 ? "Add another target…" : "Choose a target…"}
              </option>
              <option value={TARGET_OPTION_NONE}>No target</option>
              <option value={TARGET_OPTION_BOARD}>Just on the board</option>
              {activePlayers.map((p) => (
                <option key={p} value={`player:${p}`}>
                  {formatPlayerDisplayLabel(p, displayNamesByPlayer[p])}
                </option>
              ))}
              <option value={TARGET_OPTION_ALL_PLAYERS}>All players</option>
              {otherCards.map((entry) => (
                <option key={`${entry.zone}:${entry.cardId}`} value={`card:${entry.zone}:${entry.cardId}`}>
                  {`${ZONE_LABELS[entry.zone]}: ${entry.cardName}`}
                </option>
              ))}
              <option value={TARGET_OPTION_CUSTOM}>Something else…</option>
            </select>

            {isAwaitingCustomTarget(key) && (
              <div className="custom-target">
                <input
                  aria-label={`Describe the target for ${card.name}`}
                  type="text"
                  maxLength={200}
                  value={pendingCustomTextByKey[key] ?? ""}
                  onChange={(e) => setPendingCustomTextByKey((c) => ({ ...c, [key]: e.target.value }))}
                  placeholder="Describe what this points at"
                  className="field flex-1"
                />
                <button
                  type="button"
                  aria-label={`Confirm target for ${card.name}`}
                  onClick={() => handleConfirmCustomTarget(zone, card, key)}
                  className="btn"
                >
                  Add
                </button>
                <button
                  type="button"
                  aria-label={`Cancel target for ${card.name}`}
                  onClick={() => handleCancelCustomTarget(key)}
                  className="link"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* REQ-017: the freeform note is folded behind a slim row; a card that
                already has a note opens with it showing. */}
          {noteOpen && (
            <label>
              <span className="t">
                Note<small>optional</small>
              </span>
              <textarea
                aria-label={`Context notes for ${card.name}`}
                value={card.contextNotes ?? ""}
                onChange={(e) =>
                  updateZoneCard(zone, card.instanceId ?? card.cardId, {
                    contextNotes: e.target.value || undefined
                  })
                }
                rows={2}
                placeholder="Optional notes about this card's context — kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn"
                className="field resize-none"
              />
            </label>
          )}

          {/* Add a note / More details are two dashed rows sharing one line (`.ctx-tail`). */}
          <div className="ctx-tail">
            {!noteOpen && (
              <button
                type="button"
                aria-label={`Add a note for ${card.name}`}
                onClick={() => setNoteOpenByKey((c) => ({ ...c, [key]: true }))}
                className="more-row note-row"
              >
                <span>
                  <span className="glyph" aria-hidden="true">
                    ＋
                  </span>{" "}
                  Add a note
                </span>
              </button>
            )}

            {/* REQ-211: Copies (the storm case) lives behind a rarely-used More
                  details sheet, Stack cards only — today's other controls above are
                  unaffected either way. */}
            {isStackZone && (
              <button
                type="button"
                aria-label={`More details for ${card.name}`}
                onClick={() => setMoreDetailsOpenKey(key)}
                className="more-row"
              >
                <span>
                  More details{" "}
                  <span className="set">
                    {copies > 0 ? <b>{`${copies} ${copies === 1 ? "copy" : "copies"}`}</b> : null}
                  </span>
                </span>
                <span className="up" aria-hidden="true">
                  ▴
                </span>
              </button>
            )}
          </div>
        </div>

        {isStackZone && (
          <SheetShell
            isOpen={moreDetailsOpenKey === key}
            onClose={() => setMoreDetailsOpenKey(null)}
            closeLabel={`Close more details for ${card.name}`}
            titleId={`more-details-title-${key}`}
            testId={`more-details-${key}`}
            head={
              <div>
                <p className="lbl">{card.name}</p>
                <h2 id={`more-details-title-${key}`} className="text-lg font-bold">
                  More details
                </h2>
              </div>
            }
            foot={
              <button type="button" onClick={() => setMoreDetailsOpenKey(null)} className="btn primary w-full">
                Done
              </button>
            }
          >
            <div className="act-body">
              <span className="lbl">Copies</span>
              <div className="seg" role="group" aria-label="Copies">
                <button
                  type="button"
                  aria-label={`Decrease copies for ${card.name}`}
                  onClick={() =>
                    updateZoneCard(zone, card.instanceId ?? card.cardId, {
                      copies: Math.max(0, copies - 1)
                    })
                  }
                  disabled={copies <= 0}
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="copies-value">{copies}</span>
                <button
                  type="button"
                  aria-label={`Increase copies for ${card.name}`}
                  onClick={() =>
                    updateZoneCard(zone, card.instanceId ?? card.cardId, {
                      copies: Math.min(MAX_COPIES, copies + 1)
                    })
                  }
                  disabled={copies >= MAX_COPIES}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>
              <p className="text-muted text-xs">
                How many copies of this spell are on the stack besides this one (0-99, the storm case). 0 sends nothing.
              </p>
            </div>
          </SheetShell>
        )}
      </li>
    );
  }

  const hasAnswer = Boolean(answer);
  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const showSheet = totalCards > 0 && !reviewing;
  const showReview = totalCards > 0 && reviewing;
  const showQuestionForm = !hasAnswer && (totalCards === 0 || reviewing);
  const populatedZoneSummaries = CANONICAL_ZONE_ORDER.map((zone) => ({ zone, count: zones[zone]?.length ?? 0 })).filter(
    ({ count }) => count > 0
  );
  const stackSelectedButEmpty =
    gameContext?.selectedZones?.includes("stack") === true && (zones.stack?.length ?? 0) === 0;
  const fallbackQuestion = resolveFallbackQuestion(zones);
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoGrowTextarea(question, questionTextareaRef);
  // Look-matching pass (slice N, review 1 fix — finding 3): dictation now lives
  // entirely inside `ComposerPill` (its own `handleSubmit` already stops
  // dictation before calling `onSubmit`), so this step no longer needs its own
  // `useDictation` instance for the question field.
  function handleComposerSubmit(): void {
    void onDecryptStack({ preventDefault: () => undefined } as unknown as FormEvent);
  }

  // REQ-209: the review lists each card's context in words before the question box,
  // with ✎ to jump back — built on the same frozen-context word formatting the
  // post-answer View Context sheet uses, fed this step's own live (not yet frozen)
  // state and an edit handler instead of a read-only one.
  const reviewGameContext: GameContext | null = gameContext ? { ...gameContext, zones } : null;

  if (isConversationActive) {
    return (
      <PageShell variant="narrow">
        {/* The ruling takes the Ask a Question ruling view's own chrome in full: the chat head
            carries ◈ View context, ✎ Edit and the round ↺ together in its `.tools` row, and a
            CARDS thumbnail strip sits below it. The dialog itself (every game-state / zone /
            card detail) is unchanged — only its trigger is the small chip. */}
        <StagedStepHeader historyTrigger={historyTrigger} />
        <section className="chat" aria-label="Conversation">
          <div className="chat-head">
            <h1>Ask a Question</h1>
            {!isSubmitting && !isFollowUpSubmitting && (
              <div className="tools">
                {frozenGameContext && (
                  <AdaptiveContextDialog
                    triggerVariant="chip"
                    triggerLabel={getFrozenGameContextTriggerLabel(frozenGameContext)}
                    dialogLabel="Frozen game context"
                  >
                    <FrozenGameContextDetails frozenGameContext={frozenGameContext} />
                  </AdaptiveContextDialog>
                )}
                {/* REQ-209: back to the review with the game context, every card's details and the
                    question exactly as they were; the answered thread leaves the screen, already
                    saved to Question History. */}
                <button
                  type="button"
                  onClick={onEditRequest}
                  title="Change the cards or their details, then ask again"
                  className="icon-chip motion-focus"
                >
                  <span className="glyph" aria-hidden="true">
                    ✎
                  </span>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onStartOver}
                  aria-label="Start over — clears everything"
                  title="Start over — clears everything"
                  className="icon-round motion-focus"
                >
                  <span aria-hidden="true">↺</span>
                </button>
              </div>
            )}
          </div>

          {frozenGameContext && (
            <div className="chat-cards">
              <span className="lbl">Cards</span>
              {CANONICAL_ZONE_ORDER.flatMap((zone) => frozenGameContext.zones?.[zone] ?? []).map((card) => (
                <span
                  key={card.instanceId ?? card.cardId}
                  className="thumb card-identity-ring"
                  style={getCardIdentityRingStyle(card.colors)}
                  aria-hidden="true"
                >
                  {card.imageUrl ? <img src={card.imageUrl} alt="" /> : null}
                </span>
              ))}
            </div>
          )}

          <ConversationWorkspace
            messages={visibleMessages}
            pendingFeedback={isSubmitting ? <AskAiWaitingPanel isSubmitting={isSubmitting} /> : undefined}
            error={error}
            canRetry={canRetry}
            retryLabel={retryLabel}
            onRetry={onRetry}
            isFollowUpSubmitting={isFollowUpSubmitting}
            onFollowUp={onFollowUp}
            onStartOver={onStartOver}
            // The round ↺ in the head above carries Start Over; the old text button under the
            // follow-up box is retired.
            showStartOver={false}
            statusMessage={statusMessage}
          />
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell variant="narrow">
      <StagedStepHeader historyTrigger={historyTrigger} />
      <section className="idq">
        {stationsRail}
        {/* Kept as a plain, visually-hidden heading: the mockup's Context step has no generic
            eyebrow of its own (each plate's own h2 carries the card name instead), but several
            integration tests use this exact heading as their "we are on the Context station"
            marker. */}
        <h2 className="sr-only">Context enrichment</h2>

        <section className="idq-step" aria-label="Card context">
          {totalCards === 0 ? (
            <div className="plate">
              <p className="lede">Add at least one card by searching or scanning before decrypting.</p>
            </div>
          ) : showSheet && currentEntry ? (
            // `#wizard-plate`: one plate, its own way forward as the `.plate-next` foot.
            <div
              data-accent-current="true"
              className="plate wizard-plate enrichment-card-surface ambient-accent-surface ambient-accent-interactive"
            >
              <ul key={cardAnimKey} className="enrichment-card-enter wizard-card-list">
                {renderCompactSheet(currentEntry.zone, currentEntry.card)}
              </ul>
              <button
                type="button"
                aria-label={cardIndex < totalCards - 1 ? "OK — next card" : "OK — finish context"}
                onClick={handleNext}
                className="plate-next ctx-nav motion-hover motion-press motion-focus"
              >
                {cardIndex < totalCards - 1 ? (
                  <span>Next card</span>
                ) : (
                  <span>
                    Finish context<small>next: your question</small>
                  </span>
                )}
                <span className="chev" aria-hidden="true">
                  ›
                </span>
              </button>
            </div>
          ) : showReview && reviewGameContext ? (
            // `#review-plate`: "Context reviewed · N cards · Collapse ▴", a capped-height scrolling
            // list of one-line rows, and the zone filter pills at the foot.
            <div
              data-accent-current="false"
              className="plate enrichment-card-surface ambient-accent-surface motion-success"
            >
              <div className="review-head">
                <h2>
                  Context reviewed · {totalCards} {totalCards === 1 ? "card" : "cards"}
                </h2>
                <button
                  type="button"
                  className="link"
                  aria-expanded={!reviewCollapsed}
                  onClick={() => setReviewCollapsed((c) => !c)}
                >
                  {reviewCollapsed ? "Expand ▾" : "Collapse ▴"}
                </button>
              </div>
              {reviewCollapsed && (
                <p className="review-sum">{enrichmentQueue.map(({ card }) => card.name).join(" · ")}</p>
              )}
              {!reviewCollapsed && (
                <>
                  {/* One-line rows: a 30×42 thumbnail, name, zone tag, the "cast by · targets" line,
                    and a ✎ icon (`.review .row`). */}
                  <div
                    className="review"
                    ref={reviewListRef}
                    data-zone={reviewZoneFilter ?? undefined}
                    data-more-below={reviewListOverflowing}
                  >
                    {enrichmentQueue.map(({ zone, card }) => {
                      const key = cardKey(zone, card.instanceId ?? card.cardId);
                      const imageUrl = card.imageUrl?.trim() || undefined;
                      return (
                        <div key={key} className="row" data-hit={reviewZoneFilter != null && reviewZoneFilter === zone}>
                          <span
                            className="thumb card-identity-ring"
                            style={getCardIdentityRingStyle(card.colors)}
                            aria-hidden="true"
                          >
                            {imageUrl ? <img src={imageUrl} alt="" /> : null}
                          </span>
                          <div className="min-w-0">
                            <span className="nm">{card.name}</span> <span className="zone">{ZONE_LABELS[zone]}</span>
                            <span className="what">{summarizeReviewCard(zone, card)}</span>
                          </div>
                          <button
                            type="button"
                            className="edit"
                            aria-label={`Edit context for ${card.name}`}
                            onClick={() => handleEditFromReview(zone, card)}
                          >
                            ✎
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {reviewListOverflowing && (
                    <p className="review-count-line">
                      {totalCards} {totalCards === 1 ? "card" : "cards"} · scroll the list for the rest
                    </p>
                  )}
                  {populatedZoneSummaries.length > 1 && (
                    <div className="review-filters" role="group" aria-label="Pick out a zone's cards">
                      <button
                        type="button"
                        aria-pressed={reviewZoneFilter == null}
                        onClick={() => setReviewZoneFilter(null)}
                      >
                        All<b>{totalCards}</b>
                      </button>
                      {populatedZoneSummaries.map(({ zone, count }) => (
                        <button
                          key={zone}
                          type="button"
                          aria-pressed={reviewZoneFilter === zone}
                          onClick={() => setReviewZoneFilter(reviewZoneFilter === zone ? null : zone)}
                        >
                          {ZONE_LABELS[zone]}
                          <b>{count}</b>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}

          {hasAnswer ? (
            <div className="plate motion-success">
              <h2>Answer</h2>
              <p className="whitespace-pre-wrap">{answer}</p>
            </div>
          ) : isSubmitting ? (
            <AskAiWaitingPanel isSubmitting={isSubmitting} />
          ) : (
            showQuestionForm && (
              // "YOUR QUESTION — optional" with the same split-pill composer Ask a Question uses
              // (`ComposerPill`). The zone-by-zone list only renders for the zero-cards edge case
              // (nothing else on this screen names the zones then); once a review is showing, its
              // own zone tags and filter pills already say it.
              <div data-accent-current="true" className="enrichment-question-surface idq">
                {totalCards === 0 ? (
                  <div className="plate">
                    <h2>Sending to TheJudge</h2>
                    <ul>
                      {populatedZoneSummaries.map(({ zone, count }) => (
                        <li key={zone}>
                          {ZONE_LABELS[zone]}: {count} {count === 1 ? "card" : "cards"}
                        </li>
                      ))}
                      {stackSelectedButEmpty && <li className="lede">Stack: selected, no cards added</li>}
                    </ul>
                  </div>
                ) : (
                  stackSelectedButEmpty && (
                    // The review plate above never lists a zone with 0 cards, so this one line is
                    // the only place "Stack: selected, no cards added" still appears once there is
                    // something to review.
                    <p className="carry-note">Stack: selected, no cards added</p>
                  )
                )}
                <div className="composer">
                  <span className="lbl q-lbl">
                    Your question
                    {!question.trim() && <small>optional — blank asks &ldquo;{fallbackQuestion}&rdquo;</small>}
                  </span>
                  <ComposerPill
                    value={question}
                    onChange={onQuestionChange}
                    onSubmit={handleComposerSubmit}
                    maxLength={MAX_QUESTION_CHARS}
                    placeholder="How does this resolve?"
                    textareaAriaLabel="Optional question"
                    submitLabel="Decrypt Stack"
                    pendingLabel="Decrypting…"
                    isSubmitting={isSubmitting}
                    disabled={isSubmitting || !canDecrypt}
                    textareaRef={questionTextareaRef}
                    surfaceClassName="ambient-accent-surface ambient-accent-interactive"
                  />
                </div>
              </div>
            )
          )}

          {error && (
            <div className="plate motion-error">
              <p className="idq-error">{error}</p>
              <button type="button" disabled={!canRetry} onClick={() => void onRetry()} className="btn">
                {retryLabel}
              </button>
            </div>
          )}

          {statusMessage && <p className="idq-status motion-success">{statusMessage}</p>}
        </section>
      </section>
    </PageShell>
  );
}
