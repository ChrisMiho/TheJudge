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
import { CardPresentation } from "./CardPresentation";
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
    Record<string, { manaCost: string; manaValue: number } | null>
  >({});

  useEffect(() => {
    const cardId = currentEntry?.card.cardId;
    if (!cardId || cardId in manaDetailByCardId) return;

    const cached = peekCardDetail(cardId);
    if (cached !== undefined) {
      setManaDetailByCardId((m) => ({
        ...m,
        [cardId]: cached ? { manaCost: cached.manaCost, manaValue: cached.manaValue } : null
      }));
      return;
    }

    let cancelled = false;
    fetchCardDetail(cardId)
      .then((detail) => {
        if (cancelled) return;
        setManaDetailByCardId((m) => ({
          ...m,
          [cardId]: detail ? { manaCost: detail.manaCost, manaValue: detail.manaValue } : null
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
      bits.push(`targets ${targets.map((target) => formatContextTarget(target, displayNamesByPlayer)).join(", ")}`);
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

    return (
      <li
        key={key}
        // Look-matching pass (slice N), requirement 8: the context-sheet grid
        // (`in-depth-question.html:255-277` `.ctx-sheet`/`.ctx-art`/`.ctx-head`) — art
        // beside a zone/name head at top, the form spanning full width below. The
        // bordered-box shell is dropped here since the card sheet now sits flush
        // inside the step's own outer `.plate` (requirement 3).
        className="card-identity-ring ctx-sheet enrichment-card-row enrichment-card-enter"
        style={getCardIdentityRingStyle(card.colors)}
      >
        <div className="ctx-art">
          {/* REQ-017: the card's art sits at a fixed width beside the form — 210px
              desktop, 96px phone — rather than claiming the shell column's full width
              as the former per-card row did. */}
          <div className="hero enrichment-card-header">
            <CardPresentation card={card} className="w-full min-w-0" imageClassName="rounded" />
          </div>
        </div>
        <div className="ctx-head">
          <div className="eyebrow">
            <span>{ZONE_LABELS[zone]}</span>
            <button type="button" className="link" onClick={() => setReviewing(true)}>
              Skip to review
            </button>
          </div>
          <h2>{card.name}</h2>
          {/* Look-matching pass (slice N, review 1 fix — finding 3), requirement 8:
              the card's type line (`.sub`, `in-depth-question.html:271`). */}
          {card.typeLine && <div className="sub">{card.typeLine}</div>}
          {/* Requirement 8: the "N / M cards" counter moves into the head row
              (`.counter`, `in-depth-question.html:290-299`). "Card N of M" stays as
              sr-only text so the existing getByText("Card N of M") assertions keep
              resolving — same information, now also carried visually by the badge. */}
          <span className="ctx-counter" aria-hidden="true">
            {cardIndex + 1}&nbsp;/&nbsp;{totalCards}
            <small>cards</small>
          </span>
          <span className="sr-only">
            Card {cardIndex + 1} of {totalCards}
          </span>
        </div>

        <div className="ctx-form min-w-0">
          <div className="ctx-grid">
            {showsOwner && (
              <label>
                <span>Owner</span>
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
                <span>Cast by</span>
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
              <span className="t">Mana spent{manaHint ? <small>({manaHint})</small> : null}</span>
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
            <p className="lbl">Targets</p>
            {/* Look-matching pass (slice N, review 1 fix — finding 3), requirement 8:
                targets render as pills, with a thumbnail, above the picker
                (`in-depth-question.html:291-296`) — moved here from below the
                select; the mockup's own target-naming logic never actually puts a
                thumbnail in a pill, so this adds one only where the data already
                carries an image: a "card" target resolved against this card's own
                zone list. */}
            {(card.targets ?? []).length > 0 && (
              <ul className="target-list">
                {(card.targets ?? []).map((target, targetIndex) => {
                  const targetImageUrl =
                    target.kind === "card" ? zones[target.zone]?.find((c) => c.cardId === target.cardId)?.imageUrl : undefined;
                  return (
                    <li key={targetIndex} className="target-pill">
                      {targetImageUrl && (
                        <span className="thumb" aria-hidden="true">
                          <img src={targetImageUrl} alt="" />
                        </span>
                      )}
                      <span>{formatContextTarget(target, displayNamesByPlayer)}</span>
                      <button
                        type="button"
                        aria-label={`Remove target ${targetIndex + 1} for ${card.name}`}
                        onClick={() => handleRemoveTarget(zone, card, targetIndex)}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <select
              aria-label={`Add a target for ${card.name}`}
              value=""
              onChange={(e) => handleSelectTargetOption(zone, card, key, e.target.value)}
              className="field"
            >
              <option value="" disabled>
                Add another target…
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
              <div className="flex items-center gap-2">
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
                  className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-soft transition hover:bg-accent/20"
                >
                  Add
                </button>
                <button
                  type="button"
                  aria-label={`Cancel target for ${card.name}`}
                  onClick={() => handleCancelCustomTarget(key)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
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
              <span>Note</span>
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

          {/* Look-matching pass (slice N, review 1 fix — finding 3), requirement 8:
              Add a note / More details become two dashed rows sharing one line
              (`.ctx-tail`/`.more-row`, `in-depth-question.html:361-374`). Behaviour
              is unchanged: the note still hides this row once open (same as
              before), and REQ-211's Copies sheet still opens from the same click. */}
          <div className="ctx-tail">
            {!noteOpen && (
              <button
                type="button"
                aria-label={`Add a note for ${card.name}`}
                onClick={() => setNoteOpenByKey((c) => ({ ...c, [key]: true }))}
                className="more-row note-row"
              >
                <span>
                  <span aria-hidden="true">＋</span> Add a note
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
                <span>More details{(card.copies ?? 0) > 0 ? ` · +${card.copies} copies` : ""}</span>
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
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">{card.name}</p>
                <h2 id={`more-details-title-${key}`} className="text-lg font-black text-zinc-100">
                  More details
                </h2>
              </div>
            }
            foot={
              <button
                type="button"
                onClick={() => setMoreDetailsOpenKey(null)}
                className="motion-focus flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-strong text-sm font-bold text-accent-contrast"
              >
                Done
              </button>
            }
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Copies</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Decrease copies for ${card.name}`}
                  onClick={() =>
                    updateZoneCard(zone, card.instanceId ?? card.cardId, {
                      copies: Math.max(0, (card.copies ?? 0) - 1)
                    })
                  }
                  disabled={(card.copies ?? 0) <= 0}
                  className="motion-focus inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg font-black text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">−</span>
                </button>
                <span className="min-w-10 text-center text-lg font-black tabular-nums text-zinc-100">
                  {card.copies ?? 0}
                </span>
                <button
                  type="button"
                  aria-label={`Increase copies for ${card.name}`}
                  onClick={() =>
                    updateZoneCard(zone, card.instanceId ?? card.cardId, {
                      copies: Math.min(MAX_COPIES, (card.copies ?? 0) + 1)
                    })
                  }
                  disabled={(card.copies ?? 0) >= MAX_COPIES}
                  className="motion-focus inline-flex h-11 w-11 items-center justify-center rounded-full border border-accent-strong bg-accent-strong text-lg font-black text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>
              <p className="text-xs text-zinc-500">
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
        {/* Look-matching pass (slice N, review 1 fix — finding 3), requirement 10:
              the ruling takes the Ask a Question ruling view's own chrome (slice
              M) in full now — a "◈ View context" chip plus the round ↺ sit
              together in the chat-head's own `.tools` row (same pattern as
              `QuickLookupApp`'s "✎ Edit cards" + ↺), and a CARDS thumbnail strip
              replaces the full-width "VIEW CONTEXT" panel below the head. The
              dialog itself (every game-state/zone/card detail) is unchanged —
              only its trigger moved and shrank. */}
        <StagedStepHeader historyTrigger={historyTrigger} />
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
              <button
                type="button"
                onClick={onStartOver}
                aria-label="Start over — clears everything"
                title="Start over — clears everything"
                className="chat-icon-round motion-focus"
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
              <span key={card.instanceId ?? card.cardId} className="thumb" aria-hidden="true">
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
          // The round ↺ in the head above now carries Start Over (requirement 10);
          // the old text button under the follow-up box is retired.
          showStartOver={false}
          statusMessage={statusMessage}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <StagedStepHeader historyTrigger={historyTrigger} />
      {stationsRail}
      {/* Kept as a plain, visually-hidden-in-spirit heading: the mockup's Context step
            has no generic eyebrow of its own (each plate's own h2 carries the card name
            instead), but several integration tests use this exact heading as their "we
            are on the Context station" marker. */}
      <h2 className="sr-only">Context enrichment</h2>

      {totalCards === 0 ? (
        <p className="rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4 text-sm text-zinc-300">
          Add at least one card by searching or scanning before decrypting.
        </p>
      ) : showSheet && currentEntry ? (
        // Look-matching pass (slice N), requirement 3/8: one `.plate` (`#wizard-plate`,
        // `in-depth-question.html:531-562`), its own way forward as the `.plate-next`
        // foot ("Next card ›" / "OK — finish context" keeps its existing text —
        // behaviour is unchanged, only the shell and foot style are new).
        <div
          data-accent-current="true"
          className="plate enrichment-card-surface ambient-accent-surface ambient-accent-interactive"
        >
          <ul key={cardAnimKey} className="enrichment-card-enter">
            {renderCompactSheet(currentEntry.zone, currentEntry.card)}
          </ul>
          <button type="button" onClick={handleNext} className="plate-next motion-hover motion-press motion-focus">
            <span>{cardIndex < totalCards - 1 ? "OK — next card" : "OK — finish context"}</span>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      ) : showReview && reviewGameContext ? (
        // Look-matching pass (slice N), requirement 9: one plate, "Context reviewed ·
        // N cards · Collapse ▴" (`in-depth-question.html:576-582`), with a
        // capped-height scrolling list and zone filter pills.
        <div
          data-accent-current="false"
          className="plate enrichment-card-surface ambient-accent-surface motion-success"
        >
          <p className="lede" style={{ margin: "0 0 0.5rem" }}>
            Review your question&rsquo;s context.
          </p>
          <div className="review-plate-head">
            <h2 style={{ margin: 0, textTransform: "none", fontSize: "1rem", color: "#e2e8f0" }}>
              Context reviewed · {totalCards} {totalCards === 1 ? "card" : "cards"}
            </h2>
            <button type="button" className="link" onClick={() => setReviewCollapsed((c) => !c)}>
              {reviewCollapsed ? "Expand ▾" : "Collapse ▴"}
            </button>
          </div>
          {!reviewCollapsed && (
            <>
              {/* Look-matching pass (slice N), requirement 9: one-line rows — a
                  30×42 thumbnail, name, zone tag, "cast by · targets" line, and a
                  ✎ icon (`in-depth-question.html:1135-1140` `.row`). */}
              <div className="review-list" ref={reviewListRef}>
                {enrichmentQueue.map(({ zone, card }) => {
                  const key = cardKey(zone, card.instanceId ?? card.cardId);
                  const imageUrl = card.imageUrl?.trim() || undefined;
                  return (
                    <div
                      key={key}
                      className="review-row"
                      data-dimmed={reviewZoneFilter != null && reviewZoneFilter !== zone}
                      data-hit={reviewZoneFilter != null && reviewZoneFilter === zone}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-[42px] w-[30px] rounded object-cover" />
                      ) : (
                        <span aria-hidden="true" className="h-[42px] w-[30px] rounded bg-zinc-800" />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-zinc-100">{card.name}</span>{" "}
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-accent-soft">
                          {ZONE_LABELS[zone]}
                        </span>
                        <p className="truncate text-xs text-zinc-400">{summarizeReviewCard(zone, card)}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Edit context for ${card.name}`}
                        onClick={() => handleEditFromReview(zone, card)}
                        className="shrink-0 rounded-lg px-1.5 py-1 text-xs font-semibold text-accent-soft transition hover:text-accent-strong"
                      >
                        ✎
                      </button>
                    </div>
                  );
                })}
              </div>
              {reviewListOverflowing && (
                <p className="mt-1 text-xs text-zinc-500">
                  {totalCards} {totalCards === 1 ? "card" : "cards"} · scroll the list for the rest
                </p>
              )}
              {populatedZoneSummaries.length > 1 && (
                <div className="review-filters" role="group" aria-label="Pick out a zone's cards">
                  <button
                    type="button"
                    className="review-filter-pill"
                    aria-pressed={reviewZoneFilter == null}
                    onClick={() => setReviewZoneFilter(null)}
                  >
                    All<b>{totalCards}</b>
                  </button>
                  {populatedZoneSummaries.map(({ zone, count }) => (
                    <button
                      key={zone}
                      type="button"
                      className="review-filter-pill"
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
          {!question.trim() && (
            <p className="mt-1 text-sm text-zinc-300">
              No message needed — tap Send Request below when you&rsquo;re ready.
            </p>
          )}
        </div>
      ) : null}

      {hasAnswer ? (
        <div className="motion-success rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <p className="text-sm font-semibold text-accent-soft">Answer</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{answer}</p>
        </div>
      ) : isSubmitting ? (
        <AskAiWaitingPanel isSubmitting={isSubmitting} />
      ) : (
        showQuestionForm && (
          // Look-matching pass (slice N, review 1 fix — finding 3), requirement 9:
          // "YOUR QUESTION — optional" with the same split-pill composer slice M
          // built for Ask a Question (`ComposerPill`), replacing the "OPTIONAL
          // QUESTION" box and its separate mic/send circles. Requirement 9: no
          // separate summary panel — the zone-by-zone bullet list only still
          // renders for the zero-cards edge case (nothing else on this screen
          // names the zones then); once `reviewing` is true with cards present,
          // the review plate above already shows every card's own zone tag plus
          // the zone filter pills with their counts, so repeating the same
          // information here in a second shape would be the redundant panel
          // requirement 9 retires.
          <div data-accent-current="true" className="enrichment-question-surface space-y-3">
            {totalCards === 0 ? (
              <div className="space-y-2 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                <p className="text-sm font-semibold text-zinc-100">Sending to TheJudge</p>
                <ul className="space-y-1 text-sm text-zinc-300">
                  {populatedZoneSummaries.map(({ zone, count }) => (
                    <li key={zone}>
                      {ZONE_LABELS[zone]}: {count} {count === 1 ? "card" : "cards"}
                    </li>
                  ))}
                  {stackSelectedButEmpty && <li className="text-zinc-400">Stack: selected, no cards added</li>}
                </ul>
              </div>
            ) : (
              stackSelectedButEmpty && (
                // The review plate above already names every populated zone and its
                // count via its own per-card tags and filter pills (requirement 9:
                // no duplicate summary panel) — but it never lists a zone with 0
                // cards, so this one line is the only place "Stack: selected, no
                // cards added" still appears once there is something to review.
                <p className="text-xs text-zinc-400">Stack: selected, no cards added</p>
              )
            )}
            <div className="composer">
              <span className="lbl q-lbl">
                Your question
                {!question.trim() && (
                  <small>optional — blank asks &ldquo;{fallbackQuestion}&rdquo;</small>
                )}
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
        <div className="motion-error space-y-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4">
          <p className="text-sm text-rose-300">{error}</p>
          <button
            type="button"
            disabled={!canRetry}
            onClick={() => void onRetry()}
            className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retryLabel}
          </button>
        </div>
      )}

      {statusMessage && (
        <p className="motion-success rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
          {statusMessage}
        </p>
      )}

      {/* Look-matching pass (slice N), requirement 3: the free-standing "Back to
            zones" button is retired — the shared header ‹ is the only way back now. */}
    </PageShell>
  );
}
