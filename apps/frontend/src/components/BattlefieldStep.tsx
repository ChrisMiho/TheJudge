import type { KeyboardEvent } from "react";
import { CardSelectionPreview } from "./CardSelectionPreview";
import { TargetEditor } from "./TargetEditor";
import type { CardMetadataItem, PlayerLabel, StackTarget } from "../types";

type TargetKind = StackTarget["kind"];

type BattlefieldStepProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  showSuggestions: boolean;
  isMetadataLoading: boolean;
  suggestions: CardMetadataItem[];
  noMatchCopy: string;
  activeSuggestionIndex: number;
  onSuggestionHover: (index: number) => void;
  onSuggestionSelect: (card: CardMetadataItem) => void;
  selectedCard: CardMetadataItem | null;
  battlefieldEntryName: string;
  battlefieldEntryDetails: string;
  onBattlefieldEntryDetailsChange: (value: string) => void;
  targetKind: TargetKind;
  onTargetKindChange: (kind: TargetKind) => void;
  targetKindOptions: Array<{ value: TargetKind; label: string }>;
  targetStackName: string;
  onTargetStackNameChange: (value: string) => void;
  targetStackId: string;
  onTargetStackIdChange: (value: string) => void;
  targetPermanent: string;
  onTargetPermanentChange: (value: string) => void;
  targetPlayer: PlayerLabel;
  onTargetPlayerChange: (value: PlayerLabel) => void;
  targetOtherDescription: string;
  onTargetOtherDescriptionChange: (value: string) => void;
  activePlayers: PlayerLabel[];
  maxOtherTargetChars: number;
  onAddTarget: () => void;
  targets: StackTarget[];
  formatTarget: (target: StackTarget) => string;
  onRemoveTarget: (targetIndex: number) => void;
  onAddBattlefieldItem: () => void;
  onProgress: () => void;
  progressLabel: string;
  battlefieldContext: Array<{ name: string }>;
  statusMessage: string | null;
};

export function BattlefieldStep({
  searchInput,
  onSearchInputChange,
  onSearchKeyDown,
  showSuggestions,
  isMetadataLoading,
  suggestions,
  noMatchCopy,
  activeSuggestionIndex,
  onSuggestionHover,
  onSuggestionSelect,
  selectedCard,
  battlefieldEntryName,
  battlefieldEntryDetails,
  onBattlefieldEntryDetailsChange,
  targetKind,
  onTargetKindChange,
  targetKindOptions,
  targetStackName,
  onTargetStackNameChange,
  targetStackId,
  onTargetStackIdChange,
  targetPermanent,
  onTargetPermanentChange,
  targetPlayer,
  onTargetPlayerChange,
  targetOtherDescription,
  onTargetOtherDescriptionChange,
  activePlayers,
  maxOtherTargetChars,
  onAddTarget,
  targets,
  formatTarget,
  onRemoveTarget,
  onAddBattlefieldItem,
  onProgress,
  progressLabel,
  battlefieldContext,
  statusMessage
}: BattlefieldStepProps): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-sky-300">Battlefield context (optional)</h1>
        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
          Battlefield search
          <input
            aria-label="Battlefield search input"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm"
            placeholder="Type to begin"
          />
        </label>
        {showSuggestions && (
          <div className="rounded-xl border border-slate-600 bg-slate-800/70 p-2">
            {isMetadataLoading ? (
              <p className="px-2 py-1 text-sm text-slate-400">Loading cards...</p>
            ) : suggestions.length === 0 ? (
              <p className="px-2 py-1 text-sm text-slate-400">{noMatchCopy}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {suggestions.map((card, index) => (
                  <li key={`battlefield-${card.cardId}`}>
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
        {selectedCard ? (
          <CardSelectionPreview
            card={selectedCard}
            contextTitle="Battlefield context"
            contextContent={
              <>
                <textarea
                  aria-label="Battlefield item details"
                  value={battlefieldEntryDetails}
                  onChange={(event) => onBattlefieldEntryDetailsChange(event.target.value.slice(0, 280))}
                  rows={2}
                  maxLength={280}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                  placeholder="Optional details"
                />
                <TargetEditor
                  kind={targetKind}
                  onKindChange={onTargetKindChange}
                  kindOptions={targetKindOptions}
                  kindLabel="Battlefield target kind"
                  renderInputsForKind={(kind) => {
                    if (kind === "stack") {
                      return (
                        <>
                          <input
                            aria-label="Battlefield target stack name"
                            value={targetStackName}
                            onChange={(event) => onTargetStackNameChange(event.target.value)}
                            className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                            placeholder="Stack card name"
                          />
                          <input
                            aria-label="Battlefield target stack id"
                            value={targetStackId}
                            onChange={(event) => onTargetStackIdChange(event.target.value)}
                            className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                            placeholder="Stack card id (optional)"
                          />
                        </>
                      );
                    }

                    if (kind === "battlefield") {
                      return (
                        <input
                          aria-label="Battlefield target permanent"
                          value={targetPermanent}
                          onChange={(event) => onTargetPermanentChange(event.target.value)}
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                          placeholder="Permanent name"
                        />
                      );
                    }

                    if (kind === "player") {
                      return (
                        <select
                          aria-label="Battlefield target player"
                          value={targetPlayer}
                          onChange={(event) => onTargetPlayerChange(event.target.value as PlayerLabel)}
                          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                        >
                          {activePlayers.map((player) => (
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
                          aria-label="Battlefield target other"
                          value={targetOtherDescription}
                          onChange={(event) => onTargetOtherDescriptionChange(event.target.value.slice(0, maxOtherTargetChars))}
                          className="min-w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs"
                          placeholder="Describe target context"
                        />
                      );
                    }

                    return null;
                  }}
                  onAddTarget={onAddTarget}
                  addButtonLabel="Add battlefield target"
                  targets={targets}
                  formatTarget={formatTarget}
                  onRemoveTarget={onRemoveTarget}
                />
              </>
            }
            action={
              <button
                type="button"
                onClick={onAddBattlefieldItem}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-cyan-400"
              >
                Add battlefield item
              </button>
            }
          />
        ) : (
          <>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
              Battlefield item name
              <output
                aria-label="Battlefield item name"
                className="mt-2 block w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-slate-100"
              >
                {battlefieldEntryName}
              </output>
            </label>
            <p className="text-xs text-slate-300">Select a suggestion to open preview, details, and target controls.</p>
          </>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onProgress}
            className="rounded-xl border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-100"
          >
            {progressLabel}
          </button>
        </div>
        {battlefieldContext.length > 0 && (
          <ul className="space-y-1 text-sm text-slate-300">
            {battlefieldContext.map((item, index) => (
              <li key={`${item.name}-${index}`}>{`${index + 1}. ${item.name}`}</li>
            ))}
          </ul>
        )}
        {statusMessage && (
          <p className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-200">
            {statusMessage}
          </p>
        )}
      </section>
    </main>
  );
}
