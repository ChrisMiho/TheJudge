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
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [selectedPlayerLabel, setSelectedPlayerLabel] = useState<PlayerLabel | null>(null);
  const layout = seatArrangement(tracker.state.playerCount);
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

        <button
          type="button"
          aria-label={isSettingsExpanded ? "Hide game setup" : "Show game setup"}
          aria-expanded={isSettingsExpanded}
          onClick={() => setIsSettingsExpanded((current) => !current)}
          className="motion-hover motion-press motion-focus flex min-h-11 items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <span aria-hidden="true" className="text-lg leading-none text-zinc-400">
              ⚙
            </span>
            Game setup
          </span>
          <span aria-hidden="true" className="text-sm text-zinc-400">
            {isSettingsExpanded ? "▾" : "▸"}
          </span>
        </button>

        {isSettingsExpanded && (
          <div className="space-y-2">
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
          </div>
        )}

        <section
          aria-label={`${tracker.state.playerCount}-player life table`}
          data-testid="life-tracker-table"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, minmax(15rem, 1fr))`,
            minHeight: `${layout.rows * 16}rem`
          }}
          className="flex-1 gap-2 pb-1"
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
        </section>
      </div>

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
