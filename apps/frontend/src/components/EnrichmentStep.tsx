import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildEnrichmentQueue, CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { ContextTarget, GameContext, PlayerLabel, ZoneCardItem, ZoneId } from "../types";

const MAX_QUESTION_CHARS = 300;
const DEFAULT_QUESTION_FALLBACK = "Resolve the stack";

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
  isSubmitting: boolean;
  answer: string | null;
  error: string | null;
  canRetry: boolean;
  retryCountdown: number;
  onRetry: () => Promise<void>;
  statusMessage: string | null;
};

function parseManaSpent(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function formatContextTarget(target: ContextTarget): string {
  if (target.kind === "player") return `Player: ${target.targetPlayer}`;
  if (target.kind === "card") return `${ZONE_LABELS[target.zone]}: ${target.cardName}`;
  if (target.kind === "other") return `Other: ${target.targetDescription}`;
  return "No specific target";
}

export function EnrichmentStep({
  gameContext,
  zones,
  onZonesChange,
  activePlayers,
  question,
  onQuestionChange,
  onDecryptStack,
  onBack,
  isSubmitting,
  answer,
  error,
  canRetry,
  retryCountdown,
  onRetry,
  statusMessage
}: EnrichmentStepProps): JSX.Element {
  const [pendingKindByKey, setPendingKindByKey] = useState<Record<string, PendingTargetKind>>({});
  const [pendingPlayerByKey, setPendingPlayerByKey] = useState<Record<string, PlayerLabel>>({});
  const [pendingCardIdByKey, setPendingCardIdByKey] = useState<Record<string, string>>({});
  const [pendingOtherByKey, setPendingOtherByKey] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<EnrichmentViewMode>("wizard");
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardFinished, setWizardFinished] = useState(false);
  const [cardAnimKey, setCardAnimKey] = useState(0);

  const enrichmentQueue = useMemo(
    () => (gameContext ? buildEnrichmentQueue({ ...gameContext, zones }) : []),
    [gameContext, zones]
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

  function cardKey(zone: ZoneId, cardId: string): string {
    return `${zone}:${cardId}`;
  }

  function getPendingKind(key: string): PendingTargetKind {
    return pendingKindByKey[key] ?? "player";
  }

  function getPendingPlayer(key: string): PlayerLabel {
    return pendingPlayerByKey[key] ?? (activePlayers[1] ?? activePlayers[0] ?? "Player 2");
  }

  function updateZoneCard(zone: ZoneId, cardId: string, updates: Partial<ZoneCardItem>): void {
    const zoneCards = zones[zone] ?? [];
    const updated = zoneCards.map((c) => (c.cardId === cardId ? { ...c, ...updates } : c));
    onZonesChange({ ...zones, [zone]: updated });
  }

  function removeCardFromZone(zone: ZoneId, cardId: string): void {
    const updated = (zones[zone] ?? []).filter((c) => c.cardId !== cardId);
    onZonesChange({ ...zones, [zone]: updated });
  }

  function handleAddTarget(zone: ZoneId, card: ZoneCardItem, key: string): void {
    const kind = getPendingKind(key);
    let newTarget: ContextTarget;

    if (kind === "player") {
      newTarget = { kind: "player", targetPlayer: getPendingPlayer(key) };
    } else if (kind === "card") {
      const selectedCardId = pendingCardIdByKey[key] ?? "";
      const entry = contextIndex.find((e) => e.cardId === selectedCardId);
      if (!entry) return;
      newTarget = { kind: "card", zone: entry.zone, cardId: entry.cardId, cardName: entry.cardName };
      setPendingCardIdByKey((c) => ({ ...c, [key]: "" }));
    } else if (kind === "other") {
      const text = (pendingOtherByKey[key] ?? "").trim();
      if (!text) return;
      newTarget = { kind: "other", targetDescription: text };
      setPendingOtherByKey((c) => ({ ...c, [key]: "" }));
    } else {
      newTarget = { kind: "none" };
    }

    updateZoneCard(zone, card.cardId, {
      targets: [...(card.targets ?? []), newTarget]
    });
  }

  function handleRemoveTarget(zone: ZoneId, card: ZoneCardItem, targetIndex: number): void {
    updateZoneCard(zone, card.cardId, {
      targets: (card.targets ?? []).filter((_, i) => i !== targetIndex)
    });
  }

  function handleWizardNext(): void {
    if (wizardIndex < totalCards - 1) {
      setWizardIndex((current) => current + 1);
      setCardAnimKey((current) => current + 1);
      return;
    }
    setWizardFinished(true);
  }

  function renderCardRow(zone: ZoneId, card: ZoneCardItem, options?: { showRemove?: boolean }): JSX.Element {
    const key = cardKey(zone, card.cardId);
    const pendingKind = getPendingKind(key);
    const isStackZone = zone === "stack";
    const showRemove = options?.showRemove ?? true;

    return (
      <li
        key={key}
        className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-100">{card.name}</p>
            <p className="text-xs text-slate-400">{ZONE_LABELS[zone]}</p>
            {card.oracleText && (
              <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{card.oracleText}</p>
            )}
          </div>
          {showRemove && (
            <button
              type="button"
              aria-label={`Remove ${card.name}`}
              onClick={() => removeCardFromZone(zone, card.cardId)}
              className="shrink-0 rounded-lg border border-slate-600 bg-slate-800/70 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700/80"
            >
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isStackZone && (
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-[0.08em] text-slate-300">Caster</span>
              <select
                aria-label={`Caster for ${card.name}`}
                value={card.caster ?? activePlayers[0] ?? "Player 1"}
                onChange={(e) =>
                  updateZoneCard(zone, card.cardId, { caster: e.target.value as PlayerLabel })
                }
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
              >
                {activePlayers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isStackZone && (
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-[0.08em] text-slate-300">Mana spent</span>
              <input
                aria-label={`Mana spent for ${card.name}`}
                type="text"
                inputMode="numeric"
                value={card.manaSpent !== undefined ? String(card.manaSpent) : ""}
                onChange={(e) =>
                  updateZoneCard(zone, card.cardId, { manaSpent: parseManaSpent(e.target.value) })
                }
                placeholder="e.g. 3"
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Target / context</p>
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
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
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
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
              >
                {activePlayers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {pendingKind === "card" && (
              <select
                aria-label={`Card target for ${card.name}`}
                value={pendingCardIdByKey[key] ?? ""}
                onChange={(e) => setPendingCardIdByKey((c) => ({ ...c, [key]: e.target.value }))}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
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
                placeholder="Describe target or context"
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
              />
            )}

            <button
              type="button"
              aria-label={`Add target for ${card.name}`}
              onClick={() => handleAddTarget(zone, card, key)}
              className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Add target
            </button>
          </div>

          {(card.targets ?? []).length > 0 && (
            <ul className="space-y-1">
              {(card.targets ?? []).map((target, targetIndex) => (
                <li
                  key={targetIndex}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300"
                >
                  <span>{formatContextTarget(target)}</span>
                  <button
                    type="button"
                    aria-label={`Remove target ${targetIndex + 1} for ${card.name}`}
                    onClick={() => handleRemoveTarget(zone, card, targetIndex)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold uppercase tracking-[0.08em] text-slate-300">Context notes</span>
          <textarea
            aria-label={`Context notes for ${card.name}`}
            value={card.contextNotes ?? ""}
            onChange={(e) =>
              updateZoneCard(zone, card.cardId, {
                contextNotes: e.target.value || undefined
              })
            }
            rows={2}
            placeholder="Optional notes about this card's context"
            className="resize-none rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          />
        </label>
      </li>
    );
  }

  const hasAnswer = Boolean(answer);
  const retryLabel = retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry";
  const showWizard = totalCards > 0 && viewMode === "wizard" && !wizardFinished;
  const showQuestionForm = !hasAnswer && (totalCards === 0 || viewMode === "list" || wizardFinished);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 md:p-6">
        <header>
          <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            TheJudge
          </h1>
          <p className="text-sm text-slate-300">Stack Assistant</p>
        </header>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-sky-300">Context enrichment</h2>
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
              className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/80"
            >
              {viewMode === "wizard" ? "View all cards" : "Card-by-card"}
            </button>
          )}
        </div>

        {totalCards === 0 ? (
          <p className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 text-sm text-slate-300">
            No cards added — ask a timing or rules question below.
          </p>
        ) : showWizard && currentWizardEntry ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Card {wizardIndex + 1} of {totalCards}
            </p>
            <ul key={cardAnimKey} className="enrichment-card-enter">
              {renderCardRow(currentWizardEntry.zone, currentWizardEntry.card, { showRemove: false })}
            </ul>
            <button
              type="button"
              onClick={handleWizardNext}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {wizardIndex < totalCards - 1 ? "OK — next card" : "OK — finish enrichment"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {CANONICAL_ZONE_ORDER.filter((zone) => (zones[zone]?.length ?? 0) > 0).map((zone) => (
              <div key={zone} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {ZONE_LABELS[zone]}
                </p>
                <ul className="space-y-3">
                  {(zones[zone] ?? []).map((card) => renderCardRow(zone, card))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {hasAnswer ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4">
            <p className="text-sm font-semibold text-emerald-300">Answer</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{answer}</p>
          </div>
        ) : (
          showQuestionForm && (
            <form onSubmit={(e) => void onDecryptStack(e)} className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
                  Optional question
                </span>
                <textarea
                  placeholder="How does this resolve?"
                  value={question}
                  onChange={(e) => onQuestionChange(e.target.value.slice(0, MAX_QUESTION_CHARS))}
                  rows={2}
                  maxLength={MAX_QUESTION_CHARS}
                  className="resize-none rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                />
                <span className="text-right text-xs text-slate-500">
                  {question.length}/{MAX_QUESTION_CHARS}
                </span>
              </label>
              {!question.trim() && (
                <p className="text-xs text-slate-400">
                  No question? Uses fallback: &ldquo;{DEFAULT_QUESTION_FALLBACK}&rdquo;
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Decrypting…" : "Decrypt Stack"}
              </button>
            </form>
          )
        )}

        {error && (
          <div className="space-y-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4">
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
          <p className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-200">
            {statusMessage}
          </p>
        )}

        {!hasAnswer && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-500 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700/80"
          >
            Back to zones
          </button>
        )}
      </section>
    </main>
  );
}
