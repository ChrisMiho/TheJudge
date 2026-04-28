import type { FormEvent, KeyboardEvent } from "react";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { TargetEditor } from "./TargetEditor";
import type { CardMetadataItem, GameContext, PlayerLabel, StackItem, StackTarget } from "../types";

type TargetKind = StackTarget["kind"];

type StackBuilderStepProps = {
  gameContext: GameContext | null;
  battlefieldContextCount: number;
  cardMetadataCount: number;
  isMetadataLoading: boolean;
  metadataLoadError: string | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showSuggestions: boolean;
  suggestions: CardMetadataItem[];
  noMatchCopy: string;
  activeSuggestionIndex: number;
  onSuggestionHover: (index: number) => void;
  onSuggestionSelect: (card: CardMetadataItem) => void;
  selectedCard: CardMetadataItem | null;
  playerOptions: PlayerLabel[];
  entryCaster: PlayerLabel;
  onEntryCasterChange: (value: PlayerLabel) => void;
  targetKind: TargetKind;
  onTargetKindChange: (kind: TargetKind) => void;
  targetKindOptions: Array<{ value: TargetKind; label: string }>;
  targetStackCardId: string;
  onTargetStackCardIdChange: (value: string) => void;
  stack: StackItem[];
  targetBattlefieldName: string;
  onTargetBattlefieldNameChange: (value: string) => void;
  targetPlayer: PlayerLabel;
  onTargetPlayerChange: (value: PlayerLabel) => void;
  targetOtherDescription: string;
  onTargetOtherDescriptionChange: (value: string) => void;
  maxOtherTargetChars: number;
  onAddEntryTarget: () => void;
  entryTargets: StackTarget[];
  formatTarget: (target: StackTarget) => string;
  onRemoveEntryTarget: (index: number) => void;
  entryManaSpent: string;
  onEntryManaSpentChange: (value: string) => void;
  entryContextNotes: string;
  onEntryContextNotesChange: (value: string) => void;
  addButtonLabel: string;
  onAddSelectedCard: () => void;
  question: string;
  onQuestionChange: (value: string) => void;
  onDecryptStack: (event: FormEvent) => void;
  isSubmitting: boolean;
  statusMessage: string | null;
  error: string | null;
  canRetry: boolean;
  retryCountdown: number;
  onRetry: () => void;
  answer: string | null;
  showStackDetails: boolean;
  onShowStackDetailsChange: (next: boolean) => void;
  onRemoveFromStack: (cardId: string) => void;
  onUpdateStackEntry: (cardId: string, updates: Partial<StackItem>) => void;
  parseManaSpentInput: (rawValue: string) => number | undefined;
  getDetailTargetKind: (cardId: string) => TargetKind;
  onDetailTargetKindChange: (cardId: string, kind: TargetKind) => void;
  detailStackTargetByCardId: Record<string, string>;
  onDetailStackTargetChange: (cardId: string, value: string) => void;
  detailBattlefieldByCardId: Record<string, string>;
  onDetailBattlefieldChange: (cardId: string, value: string) => void;
  getDetailPlayer: (cardId: string) => PlayerLabel;
  onDetailPlayerChange: (cardId: string, value: PlayerLabel) => void;
  getDetailOther: (cardId: string) => string;
  onDetailOtherChange: (cardId: string, value: string) => void;
  onAddTargetFromStackDetails: (cardId: string) => void;
  onRemoveTargetFromStackEntry: (cardId: string, targetIndex: number) => void;
};

export function StackBuilderStep({
  gameContext,
  battlefieldContextCount,
  cardMetadataCount,
  isMetadataLoading,
  metadataLoadError,
  searchInput,
  onSearchInputChange,
  onSearchKeyDown,
  showSuggestions,
  suggestions,
  noMatchCopy,
  activeSuggestionIndex,
  onSuggestionHover,
  onSuggestionSelect,
  selectedCard,
  playerOptions,
  entryCaster,
  onEntryCasterChange,
  targetKind,
  onTargetKindChange,
  targetKindOptions,
  targetStackCardId,
  onTargetStackCardIdChange,
  stack,
  targetBattlefieldName,
  onTargetBattlefieldNameChange,
  targetPlayer,
  onTargetPlayerChange,
  targetOtherDescription,
  onTargetOtherDescriptionChange,
  maxOtherTargetChars,
  onAddEntryTarget,
  entryTargets,
  formatTarget,
  onRemoveEntryTarget,
  entryManaSpent,
  onEntryManaSpentChange,
  entryContextNotes,
  onEntryContextNotesChange,
  addButtonLabel,
  onAddSelectedCard,
  question,
  onQuestionChange,
  onDecryptStack,
  isSubmitting,
  statusMessage,
  error,
  canRetry,
  retryCountdown,
  onRetry,
  answer,
  showStackDetails,
  onShowStackDetailsChange,
  onRemoveFromStack,
  onUpdateStackEntry,
  parseManaSpentInput,
  getDetailTargetKind,
  onDetailTargetKindChange,
  detailStackTargetByCardId,
  onDetailStackTargetChange,
  detailBattlefieldByCardId,
  onDetailBattlefieldChange,
  getDetailPlayer,
  onDetailPlayerChange,
  getDetailOther,
  onDetailOtherChange,
  onAddTargetFromStackDetails,
  onRemoveTargetFromStackEntry
}: StackBuilderStepProps): JSX.Element {
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
              onClick={() => onShowStackDetailsChange(true)}
              className="relative rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Stack
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-1 text-xs font-semibold text-white">
                {stack.length}
              </span>
            </button>
          )}
        </header>
        {gameContext && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200">
            <p>{`Game context: ${gameContext.playerCount} players`}</p>
            <p>{gameContext.players.map((player) => `${player.label}=${player.lifeTotal}`).join(" | ")}</p>
            <p>{`Battlefield context entries: ${battlefieldContextCount}`}</p>
          </div>
        )}

        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
          Card search
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Type to begin"
            className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-300 shadow-inner outline-none ring-blue-400 transition focus:ring-2"
          />
          <p className="mt-1 text-[11px] normal-case tracking-normal text-slate-400">
            {isMetadataLoading
              ? "Loading card index..."
              : metadataLoadError
                ? metadataLoadError
                : `${cardMetadataCount.toLocaleString()} cards ready`}
          </p>
        </label>

        {showSuggestions && (
          <div className="rounded-xl border border-slate-600 bg-slate-800/70 p-2">
            {isMetadataLoading ? (
              <p className="px-2 py-1 text-sm text-slate-400">Loading cards...</p>
            ) : metadataLoadError ? (
              <p className="px-2 py-1 text-sm text-rose-300">{metadataLoadError}</p>
            ) : suggestions.length === 0 ? (
              <p className="px-2 py-1 text-sm text-slate-400">{noMatchCopy}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {suggestions.map((card, index) => (
                  <li key={card.cardId}>
                    <button
                      type="button"
                      onClick={() => onSuggestionSelect(card)}
                      onMouseEnter={() => onSuggestionHover(index)}
                      className={`w-full rounded-lg px-2 py-2 text-left text-sm text-slate-200 transition hover:text-sky-300 ${
                        activeSuggestionIndex === index ? "bg-slate-700 text-sky-300" : "hover:bg-slate-700"
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

        {selectedCard && (
          <CardSelectionPreview
            card={selectedCard}
            contextTitle="Stack context"
            contextContent={
              <>
                <label className="flex items-center gap-2 text-xs text-slate-200">
                  Caster
                  <select
                    aria-label="Entry caster"
                    value={entryCaster}
                    onChange={(event) => onEntryCasterChange(event.target.value as PlayerLabel)}
                    className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                  >
                    {playerOptions.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                </label>
                <TargetEditor
                  kind={targetKind}
                  onKindChange={onTargetKindChange}
                  kindOptions={targetKindOptions}
                  kindLabel="Entry target kind"
                  renderInputsForKind={(kind) => {
                    if (kind === "stack") {
                      return (
                        <select
                          aria-label="Entry stack target"
                          value={targetStackCardId}
                          onChange={(event) => onTargetStackCardIdChange(event.target.value)}
                          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        >
                          <option value="">Select stack item</option>
                          {stack.map((item) => (
                            <option key={item.cardId} value={item.cardId}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      );
                    }

                    if (kind === "battlefield") {
                      return (
                        <input
                          aria-label="Entry battlefield target"
                          value={targetBattlefieldName}
                          onChange={(event) => onTargetBattlefieldNameChange(event.target.value)}
                          placeholder="Permanent name"
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        />
                      );
                    }

                    if (kind === "player") {
                      return (
                        <select
                          aria-label="Entry player target"
                          value={targetPlayer}
                          onChange={(event) => onTargetPlayerChange(event.target.value as PlayerLabel)}
                          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        >
                          {playerOptions.map((player) => (
                            <option key={player} value={player}>
                              {player}
                            </option>
                          ))}
                        </select>
                      );
                    }

                    if (kind === "other") {
                      return (
                        <input
                          aria-label="Entry other target"
                          value={targetOtherDescription}
                          onChange={(event) => onTargetOtherDescriptionChange(event.target.value.slice(0, maxOtherTargetChars))}
                          placeholder="Describe target context"
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        />
                      );
                    }

                    return null;
                  }}
                  onAddTarget={onAddEntryTarget}
                  addButtonLabel="Add target"
                  addButtonAriaLabel="Add entry target"
                  targets={entryTargets}
                  formatTarget={formatTarget}
                  onRemoveTarget={onRemoveEntryTarget}
                />
                <label className="flex items-center gap-2 text-xs text-slate-200">
                  Mana spent
                  <input
                    aria-label="Entry mana spent"
                    value={entryManaSpent}
                    onChange={(event) => onEntryManaSpentChange(event.target.value)}
                    inputMode="numeric"
                    placeholder={`Defaults to MV (${selectedCard.manaValue})`}
                    className="w-40 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                  />
                </label>
                <textarea
                  aria-label="Entry context notes"
                  value={entryContextNotes}
                  onChange={(event) => onEntryContextNotesChange(event.target.value.slice(0, 280))}
                  rows={2}
                  maxLength={280}
                  placeholder="Optional notes (kicker, copied spell, alternate cost)"
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs placeholder:text-slate-400"
                />
              </>
            }
            action={
              <button
                type="button"
                onClick={onAddSelectedCard}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-cyan-400"
              >
                {addButtonLabel}
              </button>
            }
          />
        )}

        <form onSubmit={onDecryptStack} className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
            Optional question
            <textarea
              value={question}
              onChange={(event) => onQuestionChange(event.target.value.slice(0, 300))}
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
              onClick={onRetry}
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
                onClick={() => onShowStackDetailsChange(false)}
                className="rounded-lg border border-slate-500 bg-slate-800/80 px-2 py-1 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
              {stack.map((item, index) => (
                <li key={item.cardId} className="space-y-2 rounded-xl border border-slate-600 bg-slate-800/80 p-2">
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
                      onClick={() => onRemoveFromStack(item.cardId)}
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
                        onChange={(event) => onUpdateStackEntry(item.cardId, { caster: event.target.value as PlayerLabel })}
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      >
                        {playerOptions.map((player) => (
                          <option key={player} value={player}>
                            {player}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      Mana spent
                      <input
                        aria-label={`Mana spent for ${item.name}`}
                        value={item.manaSpent ?? ""}
                        onChange={(event) =>
                          onUpdateStackEntry(item.cardId, { manaSpent: parseManaSpentInput(event.target.value) })
                        }
                        inputMode="numeric"
                        placeholder={`Defaults to MV (${item.manaValue})`}
                        className="w-40 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Target kind for ${item.name}`}
                        value={getDetailTargetKind(item.cardId)}
                        onChange={(event) => onDetailTargetKindChange(item.cardId, event.target.value as TargetKind)}
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                      >
                        <option value="stack">Stack target</option>
                        <option value="battlefield">Battlefield target</option>
                        <option value="player">Player target</option>
                        <option value="other">Other target context</option>
                        <option value="none">No specific target</option>
                      </select>
                      {getDetailTargetKind(item.cardId) === "stack" && (
                        <select
                          aria-label={`Stack target for ${item.name}`}
                          value={detailStackTargetByCardId[item.cardId] ?? ""}
                          onChange={(event) => onDetailStackTargetChange(item.cardId, event.target.value)}
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
                          onChange={(event) => onDetailBattlefieldChange(item.cardId, event.target.value)}
                          placeholder="Permanent name"
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        />
                      )}
                      {getDetailTargetKind(item.cardId) === "player" && (
                        <select
                          aria-label={`Player target for ${item.name}`}
                          value={getDetailPlayer(item.cardId)}
                          onChange={(event) => onDetailPlayerChange(item.cardId, event.target.value as PlayerLabel)}
                          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        >
                          {playerOptions.map((player) => (
                            <option key={player} value={player}>
                              {player}
                            </option>
                          ))}
                        </select>
                      )}
                      {getDetailTargetKind(item.cardId) === "other" && (
                        <input
                          aria-label={`Other target for ${item.name}`}
                          value={getDetailOther(item.cardId)}
                          onChange={(event) => onDetailOtherChange(item.cardId, event.target.value.slice(0, maxOtherTargetChars))}
                          placeholder="Describe target context"
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        />
                      )}
                      <button
                        type="button"
                        aria-label={`Add target for ${item.name}`}
                        onClick={() => onAddTargetFromStackDetails(item.cardId)}
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
                              onClick={() => onRemoveTargetFromStackEntry(item.cardId, targetIndex)}
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
                        onUpdateStackEntry(item.cardId, {
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
