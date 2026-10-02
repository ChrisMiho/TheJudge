import { useState, type FormEvent } from "react";
import { MAX_PLAYER_COUNT, MIN_PLAYER_COUNT } from "../../../lib/lifeTracker/state";
import type { PlayerLabel } from "../../../types";
import type { CardStyle, LayoutMode } from "../../../lib/lifeTracker/types";
import { ConfirmSheet } from "../../ConfirmSheet";
import { useSheetClose } from "../../SheetShell";

export interface GameSetupPanelPlayer {
  label: PlayerLabel;
  displayName: string;
}

export interface GameSetupPanelProps {
  playerCount: number;
  layoutMode: LayoutMode;
  cardStyle: CardStyle;
  startingLife: number;
  players: GameSetupPanelPlayer[];
  onPlayerCountChange: (count: number) => void;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onCardStyleChange: (cardStyle: CardStyle) => void;
  onStartingLifeChange: (startingLife: number) => void;
  onDisplayNameChange: (label: PlayerLabel, value: string) => void;
  onReset: () => void;
  onNewGame: () => void;
}

/** REQ-202: Reset and New game each ask first through the shared confirm sheet
 * (REQ-208) rather than an in-place two-step confirm — today's confirmation
 * copy is unchanged, only where it is asked. At most one can be open at a
 * time; closing Game Setup unmounts this panel, which drops a pending one
 * with it. */
type PendingAction = "reset" | "new-game";

const STARTING_LIFE_PRESETS = [20, 25, 30, 40] as const;
const MIN_CUSTOM_STARTING_LIFE = 1;
const MAX_CUSTOM_STARTING_LIFE = 999;

export function GameSetupPanel({
  playerCount,
  layoutMode,
  cardStyle,
  startingLife,
  players,
  onPlayerCountChange,
  onLayoutModeChange,
  onCardStyleChange,
  onStartingLifeChange,
  onDisplayNameChange,
  onReset,
  onNewGame
}: GameSetupPanelProps): JSX.Element {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isEditingStartingLifeCustom, setIsEditingStartingLifeCustom] = useState(false);
  const [startingLifeDraft, setStartingLifeDraft] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  // REQ-202: the name fields sit behind an "Edit names" collapse that starts closed each time the sheet opens.
  const [isEditingNames, setIsEditingNames] = useState(false);
  // The Done bar only closes the sheet: every Game Setup change already applied as it was made.
  const closeSheet = useSheetClose();
  const isCustomStartingLife = !(STARTING_LIFE_PRESETS as readonly number[]).includes(startingLife);

  function applyCustomLife(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const isIntegerText = /^\d+$/.test(startingLifeDraft);
    const parsed = Number(startingLifeDraft);

    if (
      !isIntegerText ||
      !Number.isInteger(parsed) ||
      parsed < MIN_CUSTOM_STARTING_LIFE ||
      parsed > MAX_CUSTOM_STARTING_LIFE
    ) {
      setCustomError(`Enter a whole number from ${MIN_CUSTOM_STARTING_LIFE} to ${MAX_CUSTOM_STARTING_LIFE}.`);
      return;
    }

    setCustomError(null);
    onStartingLifeChange(parsed);
    setIsEditingStartingLifeCustom(false);
  }

  function beginCustomLifeEdit(): void {
    setStartingLifeDraft(isCustomStartingLife ? String(startingLife) : "60");
    setCustomError(null);
    setIsEditingStartingLifeCustom(true);
  }

  function cancelCustomLifeEdit(): void {
    setCustomError(null);
    setIsEditingStartingLifeCustom(false);
  }

  return (
    <section aria-label="Game setup controls" className="lt-scope lt-body">
      {/* `life-tracker-menus.html`'s Game Setup, in its own order: This game (Reset, New game as tray
          rows), Players (the joined stepper and the Edit names collapse), Starting life, then Layout and
          Card style as two segmented pills, and the lit Done bar. */}
      <div className="lt-sec">
        <span className="lbl">This game</span>
        <div className="lt-rows">
          <button type="button" aria-label="Reset current game" onClick={() => setPendingAction("reset")}>
            <span aria-hidden="true" className="glyph">
              ↺
            </span>
            <span className="words">
              Reset life totals
              <small>Back to starting life, counters cleared. Names stay.</small>
            </span>
            <span aria-hidden="true" className="chev">
              ›
            </span>
          </button>
          <button
            type="button"
            aria-label="Start new game"
            className="danger"
            onClick={() => setPendingAction("new-game")}
          >
            <span aria-hidden="true" className="glyph">
              ✦
            </span>
            <span className="words">
              New game
              <small>4 players at 40, names and counters cleared.</small>
            </span>
            <span aria-hidden="true" className="chev">
              ›
            </span>
          </button>
        </div>
      </div>

      <div className="lt-sec">
        <span data-testid="game-setup-section-players" className="lbl">
          Players
        </span>
        <div className="players-line">
          <div className="stepper" aria-label="Player count">
            <button
              type="button"
              aria-label="Decrease player count"
              onClick={() => onPlayerCountChange(playerCount - 1)}
              disabled={playerCount === MIN_PLAYER_COUNT}
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="val">
              <span>{playerCount}</span>
              <small>players</small>
            </span>
            <button
              type="button"
              aria-label="Increase player count"
              onClick={() => onPlayerCountChange(playerCount + 1)}
              disabled={playerCount === MAX_PLAYER_COUNT}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <button
            type="button"
            className="link"
            aria-expanded={isEditingNames}
            aria-controls="game-setup-names"
            onClick={() => setIsEditingNames((open) => !open)}
          >
            {isEditingNames ? "Hide names ▴" : "Edit names ▾"}
          </button>
        </div>

        {/* REQ-202: the name fields — compact boxes, two to a row, each carrying its seat number —
            sit behind the Edit names collapse. */}
        <div className="names" id="game-setup-names" data-open={isEditingNames ? "true" : "false"}>
          {isEditingNames &&
            players.map((player) => (
              <label key={player.label}>
                <span aria-hidden="true" className="num">
                  {player.label.replace("Player ", "")}
                </span>
                <input
                  aria-label={`${player.label} display name`}
                  value={player.displayName}
                  onChange={(event) => onDisplayNameChange(player.label, event.target.value)}
                  placeholder={player.label}
                />
              </label>
            ))}
        </div>
      </div>

      <div className="lt-sec">
        <span className="lbl">
          Starting life <small>2 players start at 20 · 3+ at 40</small>
        </span>
        <div className="life-pills" role="group" aria-label="Starting life presets">
          {STARTING_LIFE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Set starting life to ${preset}`}
              aria-pressed={startingLife === preset}
              onClick={() => {
                setCustomError(null);
                setIsEditingStartingLifeCustom(false);
                onStartingLifeChange(preset);
              }}
            >
              {preset}
            </button>
          ))}
          {isEditingStartingLifeCustom ? (
            <form noValidate onSubmit={applyCustomLife} className="life-custom" data-show="true">
              <input
                autoFocus
                type="number"
                min={MIN_CUSTOM_STARTING_LIFE}
                max={MAX_CUSTOM_STARTING_LIFE}
                step="1"
                className="field"
                aria-label="Custom starting life"
                aria-invalid={customError !== null}
                aria-describedby={customError ? "custom-starting-life-error" : undefined}
                value={startingLifeDraft}
                onChange={(event) => {
                  setStartingLifeDraft(event.target.value);
                  setCustomError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelCustomLifeEdit();
                  }
                }}
                onBlur={cancelCustomLifeEdit}
                inputMode="numeric"
              />
              <button
                type="submit"
                className="ok"
                aria-label="Apply custom starting life"
                onPointerDown={(event) => event.preventDefault()}
              >
                <span aria-hidden="true">✓</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="custom"
              aria-label="Set custom starting life"
              aria-pressed={isCustomStartingLife}
              onClick={beginCustomLifeEdit}
            >
              {isCustomStartingLife ? startingLife : "Custom"}
            </button>
          )}
        </div>
        {customError && (
          <p id="custom-starting-life-error" role="alert" className="lt-note-error">
            {customError}
          </p>
        )}
      </div>

      <div className="lt-sec">
        <div className="pair">
          <div className="sub">
            <small>Layout</small>
            <div className="seg full" role="group" aria-label="Layout">
              {(["grid", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={`Use ${mode} layout`}
                  aria-pressed={layoutMode === mode}
                  onClick={() => onLayoutModeChange(mode)}
                >
                  <span aria-hidden="true" className="glyph">
                    {mode === "grid" ? "▦" : "☷"}
                  </span>
                  {mode === "grid" ? "Grid" : "List"}
                </button>
              ))}
            </div>
          </div>

          <div className="sub">
            <small>Card style</small>
            <div className="seg full" role="group" aria-label="Card style">
              {(["gradient", "flat"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  aria-label={`Use ${style} card style`}
                  aria-pressed={cardStyle === style}
                  onClick={() => onCardStyleChange(style)}
                >
                  <span aria-hidden="true" className="glyph">
                    {style === "gradient" ? "◐" : "●"}
                  </span>
                  {style === "gradient" ? "Ombre" : "Flat"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button type="button" className="lt-foot" onClick={() => closeSheet?.()}>
        <span>Done</span>
        <span className="chev" aria-hidden="true">
          ›
        </span>
      </button>

      <ConfirmSheet
        isOpen={pendingAction === "reset"}
        onKeep={() => setPendingAction(null)}
        onConfirm={() => {
          setPendingAction(null);
          onReset();
        }}
        question="Reset this game?"
        detail="Every life total goes back to the starting life and all counters clear. Players, names, and settings stay."
        confirmLabel="Reset"
        testId="life-tracker-reset-confirm"
      />
      <ConfirmSheet
        isOpen={pendingAction === "new-game"}
        onKeep={() => setPendingAction(null)}
        onConfirm={() => {
          setPendingAction(null);
          onNewGame();
        }}
        question="Start a new game?"
        detail="This game is discarded: back to 4 players at 40 life, with names and counters cleared. Layout and card style stay."
        confirmLabel="New game"
        testId="life-tracker-new-game-confirm"
      />
    </section>
  );
}
