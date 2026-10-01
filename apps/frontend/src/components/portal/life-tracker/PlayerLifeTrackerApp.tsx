import { useCallback, useId, useState } from "react";
import { BrandMark } from "../../BrandMark";
import { PageShell } from "../../PageShell";
import { SheetShell } from "../../SheetShell";
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
  onClose: () => void;
}

/** REQ-202: Game Setup takes the shared sheet shell (REQ-208) — a bottom sheet below
 * 600px, a floating card from it up — in place of the former bespoke `fixed inset-0`
 * overlay. Focus trap, Escape, outside-dismiss and focus-restore all come from
 * `SheetShell` rather than being re-implemented here. */
function GameSetupModal({ tracker, onClose }: GameSetupModalProps): JSX.Element {
  const titleId = useId();

  return (
    <SheetShell
      isOpen
      onClose={onClose}
      closeLabel="Close game setup"
      titleId={titleId}
      testId="life-tracker-game-setup"
      head={
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">Life Tracker</p>
          <h2 id={titleId} className="text-xl font-black text-zinc-100">
            Game Setup
          </h2>
        </div>
      }
    >
      <GameSetupPanel
        playerCount={tracker.state.playerCount}
        layoutMode={tracker.state.layoutMode}
        cardStyle={tracker.state.cardStyle}
        startingLife={tracker.state.startingLife}
        players={tracker.state.players.map((player) => ({
          label: player.label,
          displayName: player.displayName
        }))}
        onPlayerCountChange={tracker.setPlayerCount}
        onLayoutModeChange={tracker.setLayoutMode}
        onCardStyleChange={tracker.setCardStyle}
        onStartingLifeChange={tracker.setStartingLife}
        onDisplayNameChange={tracker.setPlayerDisplayName}
        onReset={tracker.reset}
        onNewGame={tracker.newGame}
      />
    </SheetShell>
  );
}

export function PlayerLifeTrackerApp({
  onOpenCounters
}: PlayerLifeTrackerAppProps): JSX.Element {
  const tracker = useLifeTracker();
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
      {/* `height`, not `min-height`: the table is a single screen of seats, so it has to be
          capped by the viewport rather than merely floored by it. At 5-8 players the old
          `min-h` + per-row `minmax(15rem, …)` + per-card `min-h-60` floors summed past the
          screen and pushed the bottom seats below the fold; rows now share whatever height
          the screen actually has. */}
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col gap-2">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3">
          <PortalSlot />
          <div className="text-center">
            <BrandMark />
          </div>
          <div className="flex items-center gap-2 justify-self-end">
            <button
              type="button"
              data-testid="day-night-toggle"
              data-day-night-phase={tracker.state.dayNightPhase}
              // The button both reports the current designation and flips it, so the label states
              // what it is now and the visible text repeats it - MTG day/night is one game-wide
              // value with exactly two states, so "flip" needs no further disambiguation.
              aria-label={`Day and night: currently ${tracker.state.dayNightPhase}. Flip designation.`}
              onClick={tracker.toggleDayNightPhase}
              className="motion-focus flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-zinc-600 bg-zinc-900/95 px-3 text-xs font-bold text-zinc-100 shadow-lg shadow-black/40 backdrop-blur hover:bg-zinc-800"
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {tracker.state.dayNightPhase === "day" ? "☀" : "☾"}
              </span>
              <span aria-hidden="true">{tracker.state.dayNightPhase === "day" ? "Day" : "Night"}</span>
            </button>
            <button
              type="button"
              aria-label="Open game setup"
              aria-haspopup="dialog"
              aria-expanded={isSettingsExpanded}
              onClick={() => setIsSettingsExpanded(true)}
              className="motion-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/95 text-lg text-zinc-100 shadow-lg shadow-black/40 backdrop-blur hover:bg-zinc-800"
            >
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
        </header>

        <section
          aria-label={`${tracker.state.playerCount}-player life table`}
          data-testid="life-tracker-table"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`
          }}
          className="min-h-0 flex-1 gap-2 pb-1"
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
                layout={layout}
                cardStyle={tracker.state.cardStyle}
                layoutMode={tracker.state.layoutMode}
                onAdjustLife={tracker.adjustPlayerLife}
                onSetLife={tracker.setPlayerLife}
                onOpenCounters={openCounters}
              />
            );
          })}
        </section>
      </div>

      {isSettingsExpanded && <GameSetupModal tracker={tracker} onClose={closeGameSetup} />}

      {selectedPlayer && (
        <CounterPanel
          player={selectedPlayer}
          players={tracker.state.players}
          layout={layout}
          onClose={() => setSelectedPlayerLabel(null)}
          onAdjustNamedCounter={tracker.adjustNamedCounter}
          onSetNamedCounter={tracker.setNamedCounter}
          onAddCustomCounter={tracker.addCustomCounter}
          onAdjustCustomCounter={tracker.adjustCustomCounter}
          onSetCustomCounter={tracker.setCustomCounter}
          onRemoveCustomCounter={tracker.removeCustomCounter}
          onAdjustCommanderDamage={tracker.adjustCommanderDamage}
        />
      )}
    </PageShell>
  );
}
