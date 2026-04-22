import { FormEvent, useEffect, useMemo, useState } from "react";
import { createCorrelationId, logFrontendDebug } from "./lib/debugLogger";
import { apiBaseUrl } from "./lib/env";
import { getSuggestions, NO_MATCH_COPY } from "./lib/search";
import {
  appendToStack,
  buildAskAiRequest,
  buildStackItemFromMetadata,
  DEFAULT_CASTER,
  getFinalQuestion,
  removeFromStackById,
  validateStackAdd
} from "./lib/stackState";
import type {
  AskAiError,
  AskAiRequest,
  AskAiResponse,
  CardMetadataItem,
  PlayerLabel,
  StackItem,
  StackTarget
} from "./types";

const RETRY_COOLDOWN_SECONDS = 13;
const METADATA_URL = "/data/cardMetadata.json";
const EMPTY_STATE_IMAGE_URL = "/assets/cats-homescreen.png";
const PLAYER_OPTIONS: PlayerLabel[] = ["Player 1", "Player 2", "Player 3", "Player 4"];
type TargetKind = StackTarget["kind"];

function formatMetaList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "N/A";
}

function formatTarget(target: StackTarget): string {
  if (target.kind === "player") {
    return `Player: ${target.targetPlayer}`;
  }

  if (target.kind === "battlefield") {
    return `Battlefield: ${target.targetPermanent}`;
  }

  if (target.kind === "none") {
    return "No specific target";
  }

  return `Stack: ${target.targetCardName}`;
}

export default function App() {
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [metadataLoadError, setMetadataLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardMetadataItem | null>(null);
  const [stack, setStack] = useState<StackItem[]>([]);
  const [entryCaster, setEntryCaster] = useState<PlayerLabel>(DEFAULT_CASTER);
  const [entryContextNotes, setEntryContextNotes] = useState("");
  const [entryTargets, setEntryTargets] = useState<StackTarget[]>([]);
  const [targetKind, setTargetKind] = useState<TargetKind>("stack");
  const [targetStackCardId, setTargetStackCardId] = useState("");
  const [targetBattlefieldName, setTargetBattlefieldName] = useState("");
  const [targetPlayer, setTargetPlayer] = useState<PlayerLabel>("Player 2");
  const [detailTargetKindByCardId, setDetailTargetKindByCardId] = useState<Record<string, TargetKind>>({});
  const [detailStackTargetByCardId, setDetailStackTargetByCardId] = useState<Record<string, string>>({});
  const [detailBattlefieldByCardId, setDetailBattlefieldByCardId] = useState<Record<string, string>>({});
  const [detailPlayerByCardId, setDetailPlayerByCardId] = useState<Record<string, PlayerLabel>>({});
  const [showStackDetails, setShowStackDetails] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [emptyStateImageFailed, setEmptyStateImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      setIsMetadataLoading(true);
      setMetadataLoadError(null);

      try {
        const response = await fetch(METADATA_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Metadata fetch failed with status ${response.status}`);
        }

        const payload = (await response.json()) as CardMetadataItem[];
        setCardMetadata(payload);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMetadataLoadError("Card data could not be loaded. Refresh to try again.");
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsMetadataLoading(false);
        }
      }
    }

    void loadMetadata();

    return () => controller.abort();
  }, []);

  const suggestions = useMemo(() => {
    return getSuggestions(cardMetadata, searchInput);
  }, [cardMetadata, searchInput]);

  const addButtonLabel = stack.length === 0 ? "Begin stackening!" : "Add to Stack";
  const canRetry = retryCountdown === 0 && !isSubmitting;

  function flashStatus(message: string): void {
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === message ? null : current));
    }, 1400);
  }

  function startRetryCooldown(seconds: number): void {
    setRetryCountdown(seconds);
    const intervalId = window.setInterval(() => {
      setRetryCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  function resetEntryContext(): void {
    setEntryCaster(DEFAULT_CASTER);
    setEntryContextNotes("");
    setEntryTargets([]);
    setTargetKind("stack");
    setTargetStackCardId("");
    setTargetBattlefieldName("");
    setTargetPlayer("Player 2");
  }

  function addEntryTarget(): void {
    if (targetKind === "stack") {
      const targetCard = stack.find((item) => item.cardId === targetStackCardId);
      if (!targetCard) return;

      setEntryTargets((current) => [
        ...current,
        {
          kind: "stack",
          targetCardId: targetCard.cardId,
          targetCardName: targetCard.name
        }
      ]);
      setTargetStackCardId("");
      return;
    }

    if (targetKind === "battlefield") {
      const targetPermanent = targetBattlefieldName.trim();
      if (targetPermanent.length === 0) return;

      setEntryTargets((current) => [
        ...current,
        {
          kind: "battlefield",
          targetPermanent
        }
      ]);
      setTargetBattlefieldName("");
      return;
    }

    if (targetKind === "player") {
      setEntryTargets((current) => [
        ...current,
        {
          kind: "player",
          targetPlayer
        }
      ]);
      return;
    }

    setEntryTargets((current) => [...current, { kind: "none" }]);
  }

  function removeEntryTarget(indexToRemove: number): void {
    setEntryTargets((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function updateStackEntry(cardId: string, updates: Partial<StackItem>): void {
    setStack((current) =>
      current.map((item) =>
        item.cardId === cardId
          ? {
              ...item,
              ...updates
            }
          : item
      )
    );
  }

  function addTargetToStackEntry(cardId: string, target: StackTarget): void {
    setStack((current) =>
      current.map((item) =>
        item.cardId === cardId
          ? {
              ...item,
              targets: [...item.targets, target]
            }
          : item
      )
    );
  }

  function removeTargetFromStackEntry(cardId: string, targetIndexToRemove: number): void {
    setStack((current) =>
      current.map((item) =>
        item.cardId === cardId
          ? {
              ...item,
              targets: item.targets.filter((_, targetIndex) => targetIndex !== targetIndexToRemove)
            }
          : item
      )
    );
  }

  function getDetailTargetKind(cardId: string): TargetKind {
    return detailTargetKindByCardId[cardId] ?? "stack";
  }

  function getDetailPlayer(cardId: string): PlayerLabel {
    return detailPlayerByCardId[cardId] ?? "Player 2";
  }

  function addTargetFromStackDetails(cardId: string): void {
    const kind = getDetailTargetKind(cardId);
    if (kind === "stack") {
      const selectedTargetCardId = detailStackTargetByCardId[cardId] ?? "";
      const targetCard = stack.find((item) => item.cardId === selectedTargetCardId);
      if (!targetCard) return;

      addTargetToStackEntry(cardId, {
        kind: "stack",
        targetCardId: targetCard.cardId,
        targetCardName: targetCard.name
      });
      setDetailStackTargetByCardId((current) => ({ ...current, [cardId]: "" }));
      return;
    }

    if (kind === "battlefield") {
      const targetPermanent = (detailBattlefieldByCardId[cardId] ?? "").trim();
      if (targetPermanent.length === 0) return;

      addTargetToStackEntry(cardId, {
        kind: "battlefield",
        targetPermanent
      });
      setDetailBattlefieldByCardId((current) => ({ ...current, [cardId]: "" }));
      return;
    }

    if (kind === "player") {
      addTargetToStackEntry(cardId, {
        kind: "player",
        targetPlayer: getDetailPlayer(cardId)
      });
      return;
    }

    addTargetToStackEntry(cardId, { kind: "none" });
  }

  function handleAddSelectedCard(): void {
    if (!selectedCard) return;

    const stackEntry = buildStackItemFromMetadata(selectedCard, {
      caster: entryCaster,
      contextNotes: entryContextNotes,
      targets: entryTargets
    });
    const validationResult = validateStackAdd(stack, stackEntry);
    if (!validationResult.ok) {
      flashStatus(validationResult.message);
      return;
    }

    setStack((current) => {
      const nextStack = appendToStack(current, stackEntry);
      logFrontendDebug("stack.card_added", {
        cardId: stackEntry.cardId,
        cardName: stackEntry.name,
        stackSize: nextStack.length
      });
      return nextStack;
    });
    resetEntryContext();
    flashStatus("Stacked");
  }

  function removeFromStack(cardId: string): void {
    setStack((current) => removeFromStackById(current, cardId));
    setDetailTargetKindByCardId((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });
    setDetailStackTargetByCardId((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });
    setDetailBattlefieldByCardId((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });
    setDetailPlayerByCardId((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });
  }

  async function submitAskAi(payload: AskAiRequest, correlationId: string): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ask-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": correlationId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as AskAiError;
        logFrontendDebug("ask_ai.request_failed", {
          correlationId,
          status: response.status,
          retryAfterSeconds: body.retryAfterSeconds ?? RETRY_COOLDOWN_SECONDS
        });
        setError("Miho is working on it");
        startRetryCooldown(body.retryAfterSeconds ?? RETRY_COOLDOWN_SECONDS);
        return;
      }

      const body = (await response.json()) as AskAiResponse;
      logFrontendDebug("ask_ai.request_succeeded", {
        correlationId,
        status: response.status
      });
      setAnswer(body.answer);
      setError(null);
    } catch (error) {
      logFrontendDebug("ask_ai.request_failed", {
        correlationId,
        failureType: "network_or_unexpected",
        message: error instanceof Error ? error.message : "unknown"
      });
      setError("Miho is working on it");
      startRetryCooldown(RETRY_COOLDOWN_SECONDS);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecryptStack(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (stack.length === 0) {
      flashStatus("Add at least one card before decrypting.");
      return;
    }

    const correlationId = createCorrelationId();
    const finalQuestion = getFinalQuestion(question);
    const payload: AskAiRequest = buildAskAiRequest(question, stack);
    logFrontendDebug("ask_ai.submit_attempted", {
      source: "decrypt",
      correlationId,
      stackSize: stack.length,
      questionLength: finalQuestion.length,
      usedFallbackQuestion: question.trim().length === 0
    });

    await submitAskAi(payload, correlationId);
  }

  async function handleRetry(): Promise<void> {
    if (!canRetry || stack.length === 0) return;
    const correlationId = createCorrelationId();
    const finalQuestion = getFinalQuestion(question);
    logFrontendDebug("ask_ai.submit_attempted", {
      source: "retry",
      correlationId,
      stackSize: stack.length,
      questionLength: finalQuestion.length,
      usedFallbackQuestion: question.trim().length === 0
    });
    await submitAskAi(buildAskAiRequest(question, stack), correlationId);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-[0_20px_60px_-28px_rgba(30,64,175,0.65)] backdrop-blur-xl md:p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              TheJudge
            </h1>
            <p className="text-sm text-slate-300">Stack Assistant</p>
          </div>
          {stack.length > 0 && (
            <button
              type="button"
              onClick={() => setShowStackDetails(true)}
              className="relative rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Stack
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-1 text-xs font-semibold text-white">
                {stack.length}
              </span>
            </button>
          )}
        </header>

        {stack.length === 0 && (
          <div className="p-2 text-center">
            {emptyStateImageFailed ? (
              <p className="text-2xl font-semibold text-slate-200">Cat wizard</p>
            ) : (
              <img
                src={EMPTY_STATE_IMAGE_URL}
                alt="Cat wizard"
                onError={() => setEmptyStateImageFailed(true)}
                className="mx-auto w-56 max-w-full rounded-xl"
              />
            )}
          </div>
        )}

        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
          Card search
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Type to begin"
            className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-300 shadow-inner outline-none ring-blue-400 transition focus:ring-2"
          />
          <p className="mt-1 text-[11px] normal-case tracking-normal text-slate-400">
            {isMetadataLoading
              ? "Loading card index..."
              : metadataLoadError
                ? metadataLoadError
                : `${cardMetadata.length.toLocaleString()} cards ready`}
          </p>
        </label>

        {searchInput.trim().length >= 3 && (
          <div className="rounded-xl border border-slate-600 bg-slate-800/70 p-2">
            {isMetadataLoading ? (
              <p className="px-2 py-1 text-sm text-slate-400">Loading cards...</p>
            ) : metadataLoadError ? (
              <p className="px-2 py-1 text-sm text-rose-300">{metadataLoadError}</p>
            ) : suggestions.length === 0 ? (
              <p className="px-2 py-1 text-sm text-slate-400">{NO_MATCH_COPY}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {suggestions.map((card) => (
                  <li key={card.cardId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCard(card);
                        resetEntryContext();
                        logFrontendDebug("card.preview_selected", {
                          cardId: card.cardId,
                          cardName: card.name
                        });
                      }}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-700 hover:text-sky-300"
                    >
                      {card.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {selectedCard && (
          <article className="rounded-2xl border border-slate-600 bg-slate-800/75 p-4 shadow-[0_14px_34px_-24px_rgba(37,99,235,0.9)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(180px,220px)_1fr]">
              {selectedCard.imageUrl ? (
                <img
                  src={selectedCard.imageUrl}
                  alt={selectedCard.name}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/40 object-contain p-1"
                />
              ) : (
                <div className="flex min-h-56 w-full items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/40 text-xs text-slate-400">
                  No image
                </div>
              )}
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-600/80 bg-slate-900/45 p-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">{selectedCard.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedCard.oracleText}</p>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-300">
                  <dt className="font-semibold text-slate-200">Mana Cost</dt>
                  <dd>{selectedCard.manaCost || "N/A"}</dd>
                  <dt className="font-semibold text-slate-200">Mana Value</dt>
                  <dd>{selectedCard.manaValue}</dd>
                  <dt className="font-semibold text-slate-200">Type Line</dt>
                  <dd>{selectedCard.typeLine || "N/A"}</dd>
                  <dt className="font-semibold text-slate-200">Colors</dt>
                  <dd>{formatMetaList(selectedCard.colors)}</dd>
                  <dt className="font-semibold text-slate-200">Supertypes</dt>
                  <dd>{formatMetaList(selectedCard.supertypes)}</dd>
                  <dt className="font-semibold text-slate-200">Subtypes</dt>
                  <dd>{formatMetaList(selectedCard.subtypes)}</dd>
                </dl>
                <div className="space-y-2 rounded-lg border border-slate-600/70 bg-slate-900/50 p-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Stack context</p>
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    Caster
                    <select
                      aria-label="Entry caster"
                      value={entryCaster}
                      onChange={(event) => setEntryCaster(event.target.value as PlayerLabel)}
                      className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                    >
                      {PLAYER_OPTIONS.map((player) => (
                        <option key={player} value={player}>
                          {player}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Entry target kind"
                      value={targetKind}
                      onChange={(event) => setTargetKind(event.target.value as TargetKind)}
                      className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                    >
                      <option value="stack">Stack target</option>
                      <option value="battlefield">Battlefield target</option>
                      <option value="player">Player target</option>
                      <option value="none">No specific target</option>
                    </select>
                    {targetKind === "stack" && (
                      <select
                        aria-label="Entry stack target"
                        value={targetStackCardId}
                        onChange={(event) => setTargetStackCardId(event.target.value)}
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      >
                        <option value="">Select stack item</option>
                        {stack.map((item) => (
                          <option key={item.cardId} value={item.cardId}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {targetKind === "battlefield" && (
                      <input
                        aria-label="Entry battlefield target"
                        value={targetBattlefieldName}
                        onChange={(event) => setTargetBattlefieldName(event.target.value)}
                        placeholder="Permanent name"
                        className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      />
                    )}
                    {targetKind === "player" && (
                      <select
                        aria-label="Entry player target"
                        value={targetPlayer}
                        onChange={(event) => setTargetPlayer(event.target.value as PlayerLabel)}
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      >
                        {PLAYER_OPTIONS.map((player) => (
                          <option key={player} value={player}>
                            {player}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      aria-label="Add entry target"
                      onClick={addEntryTarget}
                      className="rounded-md border border-slate-500 bg-slate-700 px-2 py-1 text-xs text-slate-100"
                    >
                      Add target
                    </button>
                  </div>
                  {entryTargets.length > 0 && (
                    <ul className="space-y-1">
                      {entryTargets.map((target, index) => (
                        <li key={`${target.kind}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-slate-200">{formatTarget(target)}</span>
                          <button
                            type="button"
                            onClick={() => removeEntryTarget(index)}
                            className="rounded border border-slate-500 px-1.5 py-0.5 text-[11px] text-slate-100"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <textarea
                    aria-label="Entry context notes"
                    value={entryContextNotes}
                    onChange={(event) => setEntryContextNotes(event.target.value.slice(0, 280))}
                    rows={2}
                    maxLength={280}
                    placeholder="Optional notes (kicker, copied spell, alternate cost)"
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSelectedCard}
                  className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-cyan-400"
                >
                  {addButtonLabel}
                </button>
              </div>
            </div>
          </article>
        )}

        <form onSubmit={handleDecryptStack} className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
            Optional question
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value.slice(0, 300))}
              maxLength={300}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-300 shadow-inner outline-none ring-blue-400 transition focus:ring-2"
              placeholder="How does this resolve?"
            />
          </label>
          <button
            type="submit"
            disabled={stack.length === 0 || isSubmitting}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Decrypting..." : "Decrypt Stack"}
          </button>
        </form>

        {statusMessage && (
          <p className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-200">
            {statusMessage}
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3">
            <p className="text-sm font-medium text-rose-200">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={!canRetry}
              className="mt-2 rounded-lg border border-rose-400/60 bg-slate-900/40 px-3 py-1 text-sm font-medium text-rose-200 transition hover:bg-slate-900/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry"}
            </button>
          </div>
        )}

        {answer && (
          <article className="rounded-2xl border border-slate-600 bg-slate-800/75 p-4 shadow-[0_14px_34px_-24px_rgba(14,165,233,0.9)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-300">Response</h2>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{answer}</pre>
          </article>
        )}
      </section>

      {showStackDetails && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900/90 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Stack details</h2>
              <button
                type="button"
                onClick={() => setShowStackDetails(false)}
                className="rounded-lg border border-slate-500 bg-slate-800/80 px-2 py-1 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
              {stack.map((item, index) => (
                <li
                  key={item.cardId}
                  className="space-y-2 rounded-xl border border-slate-600 bg-slate-800/80 p-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs font-medium text-sky-300/90">{index + 1}</span>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-10 w-8 rounded-md border border-slate-600 object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-8 rounded-md bg-slate-700" />
                    )}
                    <p className="flex-1 text-sm text-slate-200">{item.name}</p>
                    <button
                      type="button"
                      onClick={() => removeFromStack(item.cardId)}
                      className="rounded-lg border border-slate-500 bg-slate-700/80 px-2 py-1 text-xs font-medium text-sky-200 transition hover:bg-slate-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2 rounded-lg border border-slate-600/70 bg-slate-900/50 p-2">
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      Caster
                      <select
                        aria-label={`Caster for ${item.name}`}
                        value={item.caster}
                        onChange={(event) =>
                          updateStackEntry(item.cardId, { caster: event.target.value as PlayerLabel })
                        }
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      >
                        {PLAYER_OPTIONS.map((player) => (
                          <option key={player} value={player}>
                            {player}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Target kind for ${item.name}`}
                        value={getDetailTargetKind(item.cardId)}
                        onChange={(event) =>
                          setDetailTargetKindByCardId((current) => ({
                            ...current,
                            [item.cardId]: event.target.value as TargetKind
                          }))
                        }
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      >
                        <option value="stack">Stack target</option>
                        <option value="battlefield">Battlefield target</option>
                        <option value="player">Player target</option>
                        <option value="none">No specific target</option>
                      </select>
                      {getDetailTargetKind(item.cardId) === "stack" && (
                        <select
                          aria-label={`Stack target for ${item.name}`}
                          value={detailStackTargetByCardId[item.cardId] ?? ""}
                          onChange={(event) =>
                            setDetailStackTargetByCardId((current) => ({
                              ...current,
                              [item.cardId]: event.target.value
                            }))
                          }
                          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        >
                          <option value="">Select stack item</option>
                          {stack
                            .filter((candidate) => candidate.cardId !== item.cardId)
                            .map((candidate) => (
                              <option key={candidate.cardId} value={candidate.cardId}>
                                {candidate.name}
                              </option>
                            ))}
                        </select>
                      )}
                      {getDetailTargetKind(item.cardId) === "battlefield" && (
                        <input
                          aria-label={`Battlefield target for ${item.name}`}
                          value={detailBattlefieldByCardId[item.cardId] ?? ""}
                          onChange={(event) =>
                            setDetailBattlefieldByCardId((current) => ({
                              ...current,
                              [item.cardId]: event.target.value
                            }))
                          }
                          placeholder="Permanent name"
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        />
                      )}
                      {getDetailTargetKind(item.cardId) === "player" && (
                        <select
                          aria-label={`Player target for ${item.name}`}
                          value={getDetailPlayer(item.cardId)}
                          onChange={(event) =>
                            setDetailPlayerByCardId((current) => ({
                              ...current,
                              [item.cardId]: event.target.value as PlayerLabel
                            }))
                          }
                          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        >
                          {PLAYER_OPTIONS.map((player) => (
                            <option key={player} value={player}>
                              {player}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        aria-label={`Add target for ${item.name}`}
                        onClick={() => addTargetFromStackDetails(item.cardId)}
                        className="rounded-md border border-slate-500 bg-slate-700 px-2 py-1 text-xs text-slate-100"
                      >
                        Add target
                      </button>
                    </div>
                    {item.targets.length > 0 && (
                      <ul className="space-y-1">
                        {item.targets.map((target, targetIndex) => (
                          <li
                            key={`${item.cardId}-${target.kind}-${targetIndex}`}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-slate-200">{formatTarget(target)}</span>
                            <button
                              type="button"
                              onClick={() => removeTargetFromStackEntry(item.cardId, targetIndex)}
                              className="rounded border border-slate-500 px-1.5 py-0.5 text-[11px] text-slate-100"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <textarea
                      aria-label={`Context notes for ${item.name}`}
                      value={item.contextNotes ?? ""}
                      onChange={(event) =>
                        updateStackEntry(item.cardId, {
                          contextNotes: event.target.value.trim().length > 0 ? event.target.value : undefined
                        })
                      }
                      rows={2}
                      maxLength={280}
                      placeholder="Optional notes"
                      className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs placeholder:text-slate-400"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
