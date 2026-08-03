import { useCallback, useEffect, useRef, useState } from "react";
import { PlayerRosterEditor } from "../../PlayerRosterEditor";
import { PageShell } from "../../PageShell";
import type { PlayerLabel } from "../../../types";
import { listSeatArrangement, seatArrangement } from "../../../lib/lifeTracker/seatArrangement";
import { useLifeTracker, type UseLifeTrackerResult } from "../../../lib/lifeTracker/useLifeTracker";
import { PortalSlot } from "../PortalSlot";
import { CounterPanel } from "./CounterPanel";
import { GameSetupPanel } from "./GameSetupPanel";
import { PlayerLifeCard } from "./PlayerLifeCard";

export interface PlayerLifeTrackerAppProps {
  /** Wave 3 composes the counter panel through this boundary. */
  onOpenCounters?: (label: PlayerLabel) => void;
}

interface GameSetupModalProps {
  tracker: UseLifeTrackerResult;
  isRosterExpanded: boolean;
  onToggleRoster: () => void;
  onClose: () => void;
}

function GameSetupModal({
  tracker,
  isRosterExpanded,
  onToggleRoster,
  onClose
}: GameSetupModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-setup-modal-title"
        tabIndex={-1}
        className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-2xl shadow-black/40"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-strong">Life Tracker</p>
            <h2 id="game-setup-modal-title" className="text-xl font-black text-zinc-900">
              Game Setup
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close game setup"
            onClick={onClose}
            className="motion-focus min-h-11 min-w-11 rounded-full border border-zinc-200 bg-zinc-100 text-2xl text-zinc-600 hover:bg-zinc-200"
          >
            ×
          </button>
        </header>

        <div className="mt-4 space-y-2">
          <GameSetupPanel
            playerCount={tracker.state.playerCount}
            layoutMode={tracker.state.layoutMode}
            startingLife={tracker.state.startingLife}
            onPlayerCountChange={tracker.setPlayerCount}
            onLayoutModeChange={tracker.setLayoutMode}
            onStartingLifeChange={tracker.setStartingLife}
            onReset={tracker.reset}
            onNewGame={tracker.newGame}
          />

          <section aria-label="Player roster" className="space-y-2">
            <PlayerRosterEditor
              players={tracker.state.players.map((player) => ({
                label: player.label,
                displayName: player.displayName
              }))}
              playerCount={tracker.state.playerCount}
              isExpanded={isRosterExpanded}
              onToggleExpanded={onToggleRoster}
              onAddPlayer={() => tracker.setPlayerCount(tracker.state.playerCount + 1)}
              onRemovePlayer={() => tracker.setPlayerCount(tracker.state.playerCount - 1)}
              onDisplayNameChange={tracker.setPlayerDisplayName}
              showCountStepper={false}
              showLifeTotals={false}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export function PlayerLifeTrackerApp({
  onOpenCounters
}: PlayerLifeTrackerAppProps): JSX.Element {
  const tracker = useLifeTracker();
  const [isRosterExpanded, setIsRosterExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [selectedPlayerLabel, setSelectedPlayerLabel] = useState<PlayerLabel | null>(null);
  const closeGameSetup = useCallback(() => setIsSettingsExpanded(false), []);
  const layout = tracker.state.layoutMode === "list"
    ? listSeatArrangement(tracker.state.playerCount)
    : seatArrangement(tracker.state.playerCount);
  const selectedPlayer = tracker.state.players.find((player) => player.label === selectedPlayerLabel);

  function openCounters(label: PlayerLabel): void {
    setSelectedPlayerLabel(label);
    onOpenCounters?.(label);
  }

  return (
    <PageShell variant="full-bleed">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col gap-2">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
          <div>
            <p className="bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text text-lg font-black tracking-tight text-transparent">
              TheJudge
            </p>
          </div>
          <PortalSlot />
          <h1 className="min-w-0 justify-self-end text-right text-sm font-black uppercase tracking-[0.1em] text-accent-soft">
            Player Life Tracker
          </h1>
        </header>

        <section
          aria-label={`${tracker.state.playerCount}-player life table`}
          data-testid="life-tracker-table"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, minmax(15rem, 1fr))`,
            minHeight: `${layout.rows * 16}rem`
          }}
          className="relative flex-1 gap-2 pb-1"
        >
          {layout.seats.map((placement) => {
            const player = tracker.state.players.find((candidate) => candidate.label === placement.label);
            if (!player) return null;

            return (
              <PlayerLifeCard
                key={player.label}
                player={player}
                players={tracker.state.players}
                placement={placement}
                onAdjustLife={tracker.adjustPlayerLife}
                onOpenCounters={openCounters}
              />
            );
          })}
          <button
            type="button"
            aria-label="Open game setup"
            aria-haspopup="dialog"
            aria-expanded={isSettingsExpanded}
            onClick={() => setIsSettingsExpanded(true)}
            className="motion-focus absolute left-1/2 top-1/2 z-30 flex min-h-14 min-w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/95 text-xl text-zinc-100 shadow-lg shadow-black/40 backdrop-blur"
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </section>
      </div>

      {isSettingsExpanded && (
        <GameSetupModal
          tracker={tracker}
          isRosterExpanded={isRosterExpanded}
          onToggleRoster={() => setIsRosterExpanded((current) => !current)}
          onClose={closeGameSetup}
        />
      )}

      {selectedPlayer && (
        <CounterPanel
          player={selectedPlayer}
          players={tracker.state.players}
          onClose={() => setSelectedPlayerLabel(null)}
          onAdjustNamedCounter={tracker.adjustNamedCounter}
          onSetNamedCounter={tracker.setNamedCounter}
          onAddCustomCounter={tracker.addCustomCounter}
          onAdjustCustomCounter={tracker.adjustCustomCounter}
          onSetCustomCounter={tracker.setCustomCounter}
          onRemoveCustomCounter={tracker.removeCustomCounter}
          onAdjustCommanderDamage={tracker.adjustCommanderDamage}
          onSetCommanderDamage={tracker.setCommanderDamage}
        />
      )}
    </PageShell>
  );
}
