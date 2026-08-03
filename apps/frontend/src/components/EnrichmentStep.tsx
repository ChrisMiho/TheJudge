import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  buildEnrichmentQueue,
  CANONICAL_ZONE_ORDER,
  resolveFallbackQuestion
} from "../lib/contextFlow";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { formatContextTarget, hasOwnerControl, parseManaSpent } from "../lib/enrichmentFormat";
import { buildPlayerDisplayNameMap, formatPlayerDisplayLabel } from "../lib/playerLabels";
import { ZONE_LABELS } from "../lib/zoneLabels";
import { useEnrichmentTargets } from "../hooks/useEnrichmentTargets";
import type { ConversationMessage, ContextTarget, GameContext, PlayerLabel, ZoneCardItem, ZoneId } from "../types";
import { AskAiWaitingPanel } from "./AskAiWaitingPanel";
import { CardPresentation } from "./CardPresentation";
import { ConversationWorkspace } from "./ConversationWorkspace";
import {
  FrozenGameContextDetails,
  getFrozenGameContextTriggerLabel
} from "./FrozenGameContextDetails";
import { PageShell } from "./PageShell";
import { PortalSlot } from "./portal/PortalSlot";
import { StagedStepHeader } from "./StagedStepHeader";

const MAX_QUESTION_CHARS = 300;

type ContextCardEntry = { zone: ZoneId; cardId: string; cardName: string };

type PendingTargetKind = ContextTarget["kind"];

type EnrichmentViewMode = "wizard" | "list";

type EnrichmentStepProps = {
  gameContext: GameContext | null;
  zones: Partial<Record<ZoneId, ZoneCardItem[]>>;
  onZonesChange: (zones: Partial<Record<ZoneId, ZoneCardItem[]>>) => void;
  activePlayers: PlayerLabel[];
  question: string;
  onQuestionChange: (q: string) => void;
  onDecryptStack: (event: FormEvent) => Promise<void>;
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
};

export function EnrichmentStep({
  gameContext,
  zones,
  onZonesChange,
  activePlayers,
  question,
  onQuestionChange,
  onDecryptStack,
  onBack,
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
  onStartOver
}: EnrichmentStepProps): JSX.Element {
  const [viewMode, setViewMode] = useState<EnrichmentViewMode>("wizard");
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardFinished, setWizardFinished] = useState(false);
  const [cardAnimKey, setCardAnimKey] = useState(0);

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
  const currentWizardEntry = enrichmentQueue[wizardIndex];

  useEffect(() => {
    if (wizardIndex >= totalCards && totalCards > 0) {
      setWizardIndex(Math.max(totalCards - 1, 0));
    }
    if (totalCards === 0) {
      setWizardFinished(false);
      setWizardIndex(0);
    }
  }, [totalCards, wizardIndex]);

  function cardKey(zone: ZoneId, instanceId: string): string {
    return `${zone}:${instanceId}`;
  }

  function updateZoneCard(zone: ZoneId, instanceId: string, updates: Partial<ZoneCardItem>): void {
    const zoneCards = zones[zone] ?? [];
    const updated = zoneCards.map((c) => (c.instanceId === instanceId ? { ...c, ...updates } : c));
    onZonesChange({ ...zones, [zone]: updated });
  }

  function removeCardFromZone(zone: ZoneId, instanceId: string): void {
    const updated = (zones[zone] ?? []).filter((c) => c.instanceId !== instanceId);
    onZonesChange({ ...zones, [zone]: updated });
  }

  const {
    setPendingKindByKey,
    setPendingPlayerByKey,
    pendingCardIdByKey,
    setPendingCardIdByKey,
    pendingOtherByKey,
    setPendingOtherByKey,
    getPendingKind,
    getPendingPlayer,
    handleAddTarget,
    handleRemoveTarget
  } = useEnrichmentTargets({ activePlayers, contextIndex, updateZoneCard });

  function handleWizardNext(): void {
    if (wizardIndex < totalCards - 1) {
      setWizardIndex((current) => current + 1);
      setCardAnimKey((current) => current + 1);
      return;
    }
    setWizardFinished(true);
  }

  function renderCardRow(zone: ZoneId, card: ZoneCardItem, options?: { showRemove?: boolean }): JSX.Element {
    const key = cardKey(zone, card.instanceId ?? card.cardId);
    const pendingKind = getPendingKind(key);
    const isStackZone = zone === "stack";
    const showsOwner = hasOwnerControl(zone);
    const showRemove = options?.showRemove ?? true;

    return (
      <li
        key={key}
        className="card-identity-ring enrichment-card-row enrichment-card-enter card-state-remove space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
        style={getCardIdentityRingStyle(card.colors)}
      >
        <div className="enrichment-card-header">
          <CardPresentation
            card={card}
            className="enrichment-card-presentation w-full min-w-0"
            imageClassName="shrink-0 rounded"
            actions={
              showRemove ? (
                <button
                  type="button"
                  aria-label={`Remove ${card.name}`}
                  onClick={() => removeCardFromZone(zone, card.instanceId ?? card.cardId)}
                  className="card-state-remove-trigger w-full rounded-lg border border-zinc-600 bg-zinc-800/70 px-2 py-1 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700/80"
                >
                  Remove
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showsOwner && (
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-[0.08em] text-zinc-300">Ownership</span>
              <select
                aria-label={`Owner for ${card.name}`}
                value={card.owner ?? gameContext?.activePlayer ?? activePlayers[0] ?? "Player 1"}
                onChange={(e) =>
                  updateZoneCard(zone, card.instanceId ?? card.cardId, { owner: e.target.value as PlayerLabel })
                }
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
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
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-[0.08em] text-zinc-300">Caster</span>
              <select
                aria-label={`Caster for ${card.name}`}
                value={card.caster ?? activePlayers[0] ?? "Player 1"}
                onChange={(e) =>
                  updateZoneCard(zone, card.instanceId ?? card.cardId, { caster: e.target.value as PlayerLabel })
                }
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
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
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-[0.08em] text-zinc-300">Mana spent</span>
              <input
                aria-label={`Mana spent for ${card.name}`}
                type="text"
                inputMode="numeric"
                value={card.manaSpent !== undefined ? String(card.manaSpent) : ""}
                onChange={(e) =>
                  updateZoneCard(zone, card.instanceId ?? card.cardId, { manaSpent: parseManaSpent(e.target.value) })
                }
                placeholder="e.g. 3"
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Targets</p>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label={`Target kind for ${card.name}`}
              value={pendingKind}
              onChange={(e) =>
                setPendingKindByKey((c) => ({
                  ...c,
                  [key]: e.target.value as PendingTargetKind
                }))
              }
              className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
            >
              <option value="player">Player</option>
              <option value="card">Zone card</option>
              <option value="none">None</option>
              <option value="other">Other</option>
            </select>

            {pendingKind === "player" && (
              <select
                aria-label={`Player target for ${card.name}`}
                value={getPendingPlayer(key)}
                onChange={(e) =>
                  setPendingPlayerByKey((c) => ({
                    ...c,
                    [key]: e.target.value as PlayerLabel
                  }))
                }
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
              >
                {activePlayers.map((p) => (
                  <option key={p} value={p}>
                    {formatPlayerDisplayLabel(p, displayNamesByPlayer[p])}
                  </option>
                ))}
              </select>
            )}

            {pendingKind === "card" && (
              <select
                aria-label={`Card target for ${card.name}`}
                value={pendingCardIdByKey[key] ?? ""}
                onChange={(e) => setPendingCardIdByKey((c) => ({ ...c, [key]: e.target.value }))}
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
              >
                <option value="">Select card…</option>
                {contextIndex.map((entry) => (
                  <option key={`${entry.zone}:${entry.cardId}`} value={entry.cardId}>
                    {`${ZONE_LABELS[entry.zone]}: ${entry.cardName}`}
                  </option>
                ))}
              </select>
            )}

            {pendingKind === "other" && (
              <input
                aria-label={`Other target for ${card.name}`}
                type="text"
                value={pendingOtherByKey[key] ?? ""}
                onChange={(e) => setPendingOtherByKey((c) => ({ ...c, [key]: e.target.value }))}
                placeholder="Describe what this points at"
                className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
              />
            )}

            <button
              type="button"
              aria-label={`Add target for ${card.name}`}
              onClick={() => handleAddTarget(zone, card, key)}
              className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-soft transition hover:bg-accent/20"
            >
              Add target
            </button>
          </div>

          {(card.targets ?? []).length > 0 && (
            <ul className="space-y-1">
              {(card.targets ?? []).map((target, targetIndex) => (
                <li
                  key={targetIndex}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300"
                >
                  <span>{formatContextTarget(target, displayNamesByPlayer)}</span>
                  <button
                    type="button"
                    aria-label={`Remove target ${targetIndex + 1} for ${card.name}`}
                    onClick={() => handleRemoveTarget(zone, card, targetIndex)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-[0.08em] text-zinc-300">Context notes</span>
          <textarea
            aria-label={`Context notes for ${card.name}`}
            value={card.contextNotes ?? ""}
            onChange={(e) =>
              updateZoneCard(zone, card.instanceId ?? card.cardId, {
                contextNotes: e.target.value || undefined
              })
            }
            rows={2}
            placeholder="Optional notes about this card's context"
            className="resize-none rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
          />
        </label>
      </li>
    );
  }

  const hasAnswer = Boolean(answer);
  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const showWizard = totalCards > 0 && viewMode === "wizard" && !wizardFinished;
  const showWizardFinished = totalCards > 0 && viewMode === "wizard" && wizardFinished;
  const showQuestionForm = !hasAnswer && (totalCards === 0 || viewMode === "list" || wizardFinished);
  const populatedZoneSummaries = CANONICAL_ZONE_ORDER
    .map((zone) => ({ zone, count: zones[zone]?.length ?? 0 }))
    .filter(({ count }) => count > 0);
  const stackSelectedButEmpty =
    gameContext?.selectedZones?.includes("stack") === true && (zones.stack?.length ?? 0) === 0;
  const fallbackQuestion = resolveFallbackQuestion(zones);

  if (isConversationActive) {
    return (
      <PageShell>
          <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
            <h1 className="bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              TheJudge
            </h1>
            <PortalSlot />
            <div />
          </header>

          <ConversationWorkspace
            messages={visibleMessages}
            context={
              frozenGameContext
                ? {
                    triggerLabel: getFrozenGameContextTriggerLabel(frozenGameContext),
                    dialogLabel: "Frozen game context",
                    content: (
                      <FrozenGameContextDetails frozenGameContext={frozenGameContext} />
                    )
                  }
                : undefined
            }
            pendingFeedback={
              isSubmitting ? <AskAiWaitingPanel isSubmitting={isSubmitting} /> : undefined
            }
            error={error}
            canRetry={canRetry}
            retryLabel={retryLabel}
            onRetry={onRetry}
            isFollowUpSubmitting={isFollowUpSubmitting}
            onFollowUp={onFollowUp}
            onStartOver={onStartOver}
            showStartOver={!isSubmitting && !isFollowUpSubmitting}
            statusMessage={statusMessage}
          />
      </PageShell>
    );
  }

  return (
    <PageShell>
        <StagedStepHeader stepName="Context enrichment" />

        <div className="flex items-center justify-between gap-3">
          {totalCards > 0 && !hasAnswer && (
            <button
              type="button"
              onClick={() => {
                if (viewMode === "wizard") {
                  setViewMode("list");
                } else {
                  setViewMode("wizard");
                  setWizardFinished(false);
                }
              }}
              className="ambient-accent-surface ambient-accent-interactive rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
            >
              {viewMode === "wizard" ? "View all cards" : "Card-by-card"}
            </button>
          )}
        </div>

        {totalCards === 0 ? (
          <p className="rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4 text-sm text-zinc-300">
            Add at least one card by searching or scanning before decrypting.
          </p>
        ) : showWizard && currentWizardEntry ? (
          <div
            data-accent-current="true"
            className="enrichment-card-surface ambient-accent-surface ambient-accent-interactive space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
          >
            <p className="text-sm text-zinc-400">
              Card {wizardIndex + 1} of {totalCards}
            </p>
            <ul key={cardAnimKey} className="enrichment-card-enter">
              {renderCardRow(currentWizardEntry.zone, currentWizardEntry.card, { showRemove: false })}
            </ul>
            <button
              type="button"
              onClick={handleWizardNext}
              className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:opacity-90"
            >
              {wizardIndex < totalCards - 1 ? "OK — next card" : "OK — finish enrichment"}
            </button>
          </div>
        ) : showWizardFinished ? (
          <div
            data-accent-current="false"
            className="enrichment-card-surface ambient-accent-surface motion-success rounded-2xl border border-accent/40 bg-accent/10 p-4"
          >
            <p className="text-sm font-semibold text-accent-soft">Ready to decrypt.</p>
            <p className="mt-1 text-sm text-zinc-300">
              Card context reviewed. Use View all cards to make more edits.
            </p>
          </div>
        ) : (
          <div
            data-accent-current="true"
            className="enrichment-card-surface ambient-accent-surface ambient-accent-interactive space-y-6 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
          >
            {CANONICAL_ZONE_ORDER.filter((zone) => (zones[zone]?.length ?? 0) > 0).map((zone) => (
              <div key={zone} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {ZONE_LABELS[zone]}
                </p>
                <ul className="scroll-cap-4-enrichment space-y-3">
                  {(zones[zone] ?? []).map((card) => renderCardRow(zone, card))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {hasAnswer ? (
          <div className="motion-success rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="text-sm font-semibold text-accent-soft">Answer</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{answer}</p>
          </div>
        ) : isSubmitting ? (
          <AskAiWaitingPanel isSubmitting={isSubmitting} />
        ) : (
          showQuestionForm && (
            <form
              onSubmit={(e) => void onDecryptStack(e)}
              data-accent-current="true"
              className="enrichment-question-surface ambient-accent-surface ambient-accent-interactive space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
            >
              <div className="space-y-2 rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                <p className="text-sm font-semibold text-zinc-100">Sending to TheJudge</p>
                <ul className="space-y-1 text-sm text-zinc-300">
                  {populatedZoneSummaries.map(({ zone, count }) => (
                    <li key={zone}>
                      {ZONE_LABELS[zone]}: {count} {count === 1 ? "card" : "cards"}
                    </li>
                  ))}
                  {stackSelectedButEmpty && (
                    <li className="text-zinc-400">Stack: selected, no cards added</li>
                  )}
                </ul>
                {!question.trim() && (
                  <p className="text-xs text-zinc-400">
                    No question? Uses fallback: &ldquo;{fallbackQuestion}&rdquo;
                  </p>
                )}
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
                  Optional question
                </span>
                <textarea
                  placeholder="How does this resolve?"
                  value={question}
                  onChange={(e) => onQuestionChange(e.target.value.slice(0, MAX_QUESTION_CHARS))}
                  rows={2}
                  maxLength={MAX_QUESTION_CHARS}
                  className="resize-none rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                />
                <span className="text-right text-xs text-zinc-500">
                  {question.length}/{MAX_QUESTION_CHARS}
                </span>
              </label>
              <button
                type="submit"
                disabled={isSubmitting || !canDecrypt}
                className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Decrypting…" : "Decrypt Stack"}
              </button>
            </form>
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

        {!hasAnswer && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-zinc-500 bg-zinc-800/70 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700/80"
          >
            Back to zones
          </button>
        )}
    </PageShell>
  );
}
