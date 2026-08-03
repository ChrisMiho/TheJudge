import { useState } from "react";
import { PlayerRosterEditor } from "../../PlayerRosterEditor";
import { PageShell } from "../../PageShell";
import type { PlayerLabel } from "../../../types";
import { seatArrangement } from "../../../lib/lifeTracker/seatArrangement";
import { useLifeTracker } from "../../../lib/lifeTracker/useLifeTracker";
import { PortalSlot } from "../PortalSlot";
import { CounterPanel } from "./CounterPanel";
import { GameSetupPanel } from "./GameSetupPanel";
import { PlayerLifeCard } from "./PlayerLifeCard";

export interface PlayerLifeTrackerAppProps {
  /** Wave 3 composes the counter panel through this boundary. */
  onOpenCounters?: (label: PlayerLabel) => void;
}

export function PlayerLifeTrackerApp({
  onOpenCounters
}: PlayerLifeTrackerAppProps): JSX.Element {
  const tracker = useLifeTracker();
  const [isRosterExpanded, setIsRosterExpanded] = useState(false);
  const [selectedPlayerLabel, setSelectedPlayerLabel] = useState<PlayerLabel | null>(null);
  const layout = seatArrangement(tracker.state.playerCount);
  const selectedPlayer = tracker.state.players.find((player) => player.label === selectedPlayerLabel);

  function openCounters(label: PlayerLabel): void {
    setSelectedPlayerLabel(label);
    onOpenCounters?.(label);
  }

  return (
    <PageShell>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
        <div>
          <p className="bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text text-2xl font-black tracking-tight text-transparent">
            TheJudge
          </p>
          <p className="text-sm text-zinc-400">Live table</p>
        </div>
        <PortalSlot />
        <h1 className="min-w-0 justify-self-end text-right text-lg font-black text-accent-soft sm:text-xl">
          Player Life Tracker
        </h1>
      </header>

      <GameSetupPanel
        startingLife={tracker.state.startingLife}
        commanderDamageToLife={tracker.state.commanderDamageToLife}
        onStartingLifeChange={tracker.setStartingLife}
        onCommanderDamageToLifeChange={tracker.setCommanderDamageToLife}
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
          onToggleExpanded={() => setIsRosterExpanded((current) => !current)}
          onAddPlayer={() => tracker.setPlayerCount(tracker.state.playerCount + 1)}
          onRemovePlayer={() => tracker.setPlayerCount(tracker.state.playerCount - 1)}
          onDisplayNameChange={tracker.setPlayerDisplayName}
          showLifeTotals={false}
        />
      </section>

      <section
        aria-label={`${tracker.state.playerCount}-player life table`}
        data-testid="life-tracker-table"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(12rem, 1fr))`,
          minHeight: `${layout.rows * 13}rem`
        }}
        className="gap-2"
      >
        {layout.seats.map((placement) => {
          const player = tracker.state.players.find((candidate) => candidate.label === placement.label);
          if (!player) return null;

          return (
            <PlayerLifeCard
              key={player.label}
              player={player}
              placement={placement}
              onAdjustLife={tracker.adjustPlayerLife}
              onOpenCounters={openCounters}
            />
          );
        })}
      </section>

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
