import { FormEvent, useEffect, useState } from "react";
import { EnrichmentStep } from "./components/EnrichmentStep";
import { StagedStepHeader } from "./components/StagedStepHeader";
import { ThemeControl } from "./components/ThemeControl";
import { ZoneCollectionStep } from "./components/ZoneCollectionStep";
import { ZoneConfirmStep } from "./components/ZoneConfirmStep";
import { logFrontendDebug } from "./lib/debugLogger";
import { apiBaseUrl } from "./lib/env";
import {
  buildAskAiRequest,
  canAdvance,
  DEFAULT_TURN_PHASE,
  getNextStep,
  getPreviousStep,
  mergeSelectedZonesOnPhaseChange,
  type FlowStepId
} from "./lib/contextFlow";
import { formatPlayerDisplayLabel } from "./lib/playerLabels";
import { useAskAiSubmitOrchestration } from "./hooks/useAskAiSubmitOrchestration";
import { useLayoutDensity } from "./hooks/useLayoutDensity";
import { useThemePalette } from "./hooks/useThemePalette";
import { PageShell } from "./components/PageShell";
import type {
  CardMetadataItem,
  CombatStep,
  GameContext,
  GamePlayerContext,
  PlayerLabel,
  TurnPhase,
  ZoneCardItem,
  ZoneId
} from "./types";

const RETRY_COOLDOWN_SECONDS = 13;
const METADATA_URL = "/data/cardMetadata.json";
const EMPTY_STATE_IMAGE_URL = "/assets/cats-homescreen.png";
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const DUEL_STARTING_LIFE_TOTAL = "20";
const MULTIPLAYER_STARTING_LIFE_TOTAL = "40";
const PLAYER_OPTIONS: PlayerLabel[] = Array.from({ length: MAX_PLAYERS }, (_, index) => `Player ${index + 1}` as PlayerLabel);

const TURN_PHASE_OPTIONS: Array<{ value: TurnPhase; label: string }> = [
  { value: "untap", label: "Untap" },
  { value: "upkeep", label: "Upkeep" },
  { value: "draw", label: "Draw" },
  { value: "main_1", label: "Pre Combat Main Phase" },
  { value: "combat", label: "Combat" },
  { value: "main_2", label: "Post Combat Main Phase" },
  { value: "end_step", label: "End Step" },
  { value: "cleanup", label: "Cleanup" }
];

const COMBAT_STEP_OPTIONS: Array<{ value: CombatStep; label: string }> = [
  { value: "beginning_of_combat", label: "Beginning of Combat" },
  { value: "declare_attackers", label: "Declare Attackers" },
  { value: "declare_blockers", label: "Declare Blockers" },
  { value: "combat_damage", label: "Combat Damage" },
  { value: "end_of_combat", label: "End of Combat" }
];

export default function App() {
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [flowStep, setFlowStep] = useState<FlowStepId>("game-context");
  const [activePlayerCount, setActivePlayerCount] = useState(MIN_PLAYERS);
  const [lifeTotalsByPlayer, setLifeTotalsByPlayer] = useState<Record<PlayerLabel, string>>(() =>
    PLAYER_OPTIONS.reduce<Record<PlayerLabel, string>>(
      (accumulator, player, index) => ({
        ...accumulator,
        [player]: index < MIN_PLAYERS ? DUEL_STARTING_LIFE_TOTAL : MULTIPLAYER_STARTING_LIFE_TOTAL
      }),
      {} as Record<PlayerLabel, string>
    )
  );
  const [gameContext, setGameContext] = useState<GameContext | null>(null);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(DEFAULT_TURN_PHASE);
  const [combatStep, setCombatStep] = useState<CombatStep>("declare_blockers");
  const [confirmedPhase, setConfirmedPhase] = useState<TurnPhase | undefined>(undefined);
  const [activePlayer, setActivePlayer] = useState<PlayerLabel>("Player 1");
  const [selectedZones, setSelectedZones] = useState<ZoneId[]>([]);
  const [zoneCardsByZone, setZoneCardsByZone] = useState<Partial<Record<ZoneId, ZoneCardItem[]>>>({});
  const [question, setQuestion] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [emptyStateImageFailed, setEmptyStateImageFailed] = useState(false);
  const [brandClickCount, setBrandClickCount] = useState(0);
  const showCatEasterEgg = brandClickCount >= 10;
  const [playersDetailsExpanded, setPlayersDetailsExpanded] = useState(false);
  const [displayNamesByPlayer, setDisplayNamesByPlayer] = useState<Record<PlayerLabel, string>>(() =>
    PLAYER_OPTIONS.reduce<Record<PlayerLabel, string>>(
      (accumulator, player) => ({ ...accumulator, [player]: player }),
      {} as Record<PlayerLabel, string>
    )
  );
  const { paletteId, setPalette } = useThemePalette();
  const { density, setDensity } = useLayoutDensity();

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      setIsMetadataLoading(true);

      try {
        const response = await fetch(METADATA_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Metadata fetch failed with status ${response.status}`);
        }

        const payload = (await response.json()) as CardMetadataItem[];
        setCardMetadata(payload);
      } catch (error) {
        if (!controller.signal.aborted) {
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

  const activePlayers = PLAYER_OPTIONS.slice(0, activePlayerCount);
  const {
    answer,
    error,
    isSubmitting,
    isFollowUpSubmitting,
    retryCountdown,
    canRetry,
    visibleMessages,
    frozenGameContext,
    isConversationActive,
    submitAttempt,
    submitFollowUp,
    startOver
  } = useAskAiSubmitOrchestration({
    apiBaseUrl,
    retryCooldownSeconds: RETRY_COOLDOWN_SECONDS
  });

  function flashStatus(message: string): void {
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === message ? null : current));
    }, 1400);
  }

  function updateLifeTotal(player: PlayerLabel, value: string): void {
    setLifeTotalsByPlayer((current) => ({
      ...current,
      [player]: value
    }));
  }

  function addPlayer(): void {
    if (activePlayerCount >= MAX_PLAYERS) return;
    const nextCount = activePlayerCount + 1;
    const nextPlayer = PLAYER_OPTIONS[nextCount - 1];
    if (!nextPlayer) return;

    setLifeTotalsByPlayer((current) => {
      const nextLifeTotals = {
        ...current,
        [nextPlayer]: current[nextPlayer] || MULTIPLAYER_STARTING_LIFE_TOTAL
      };

      if (nextCount === 3) {
        for (const player of PLAYER_OPTIONS.slice(0, MIN_PLAYERS)) {
          if (nextLifeTotals[player] === DUEL_STARTING_LIFE_TOTAL) {
            nextLifeTotals[player] = MULTIPLAYER_STARTING_LIFE_TOTAL;
          }
        }
      }

      return nextLifeTotals;
    });
    setActivePlayerCount(nextCount);
  }

  function removePlayer(): void {
    if (activePlayerCount <= MIN_PLAYERS) return;
    const nextCount = activePlayerCount - 1;
    if (nextCount === MIN_PLAYERS) {
      setLifeTotalsByPlayer((current) => ({
        ...current,
        "Player 1": DUEL_STARTING_LIFE_TOTAL,
        "Player 2": DUEL_STARTING_LIFE_TOTAL
      }));
    }
    setActivePlayerCount(nextCount);
  }

  function updateDisplayName(player: PlayerLabel, value: string): void {
    setDisplayNamesByPlayer((current) => ({
      ...current,
      [player]: value
    }));
  }

  function buildPlayers(): GamePlayerContext[] {
    return activePlayers.map((player) => {
      const parsed = Number(lifeTotalsByPlayer[player]);
      const trimmedName = displayNamesByPlayer[player]?.trim() ?? "";
      const displayName = trimmedName.length > 0 && trimmedName !== player ? trimmedName : undefined;
      return {
        label: player,
        lifeTotal: Number.isFinite(parsed) ? parsed : NaN,
        displayName
      };
    });
  }

  function confirmGameContext(): void {
    const players = buildPlayers();

    if (players.some((player) => Number.isNaN(player.lifeTotal))) {
      flashStatus("Enter numeric life totals for each active player.");
      return;
    }

    if (!turnPhase) {
      flashStatus("Choose a turn phase.");
      return;
    }

    setGameContext({
      playerCount: activePlayers.length,
      players,
      turnPhase,
      ...(turnPhase === "combat" ? { combatStep } : {}),
      activePlayer
    });
    logFrontendDebug("game_context.confirmed", {
      playerCount: activePlayers.length
    });

    setSelectedZones((current) => mergeSelectedZonesOnPhaseChange(current, turnPhase, confirmedPhase));
    setConfirmedPhase(turnPhase);

    const nextStep = getNextStep("game-context");
    if (nextStep) {
      setFlowStep(nextStep);
    }
    flashStatus("Game context saved.");
  }

  function confirmZoneSelection(): void {
    setGameContext((current) => (current ? { ...current, selectedZones } : current));
    const nextStep = getNextStep("zone-confirm");
    if (nextStep) {
      setFlowStep(nextStep);
    }
  }

  function finishZoneCollection(): void {
    if (!canAdvance("zone-collection", { gameContext: { selectedZones, zones: zoneCardsByZone } })) {
      flashStatus("Add at least one card in a selected zone before continuing.");
      return;
    }

    setGameContext((current) =>
      current
        ? {
            ...current,
            selectedZones,
            zones: zoneCardsByZone
          }
        : current
    );
    const nextStep = getNextStep("zone-collection");
    if (nextStep) {
      setFlowStep(nextStep);
    }
  }

  async function handleDecryptStack(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (!canAdvance("enrichment", { gameContext: { selectedZones, zones: zoneCardsByZone } })) {
      flashStatus("Add at least one card in a selected zone before decrypting.");
      return;
    }

    if (!gameContext) {
      flashStatus("Confirm game context before decrypting.");
      return;
    }

    const updatedContext: GameContext = { ...gameContext, zones: zoneCardsByZone };
    const payload = buildAskAiRequest(question, updatedContext);
    const stackSize = zoneCardsByZone.stack?.length ?? 0;
    const finalQuestion = payload.question;

    await submitAttempt({
      source: "decrypt",
      payload,
      stackSize,
      finalQuestion,
      usedFallbackQuestion: question.trim().length === 0
    });
  }

  async function handleRetry(): Promise<void> {
    if (!canRetry || !gameContext) return;
    if (!canAdvance("enrichment", { gameContext: { selectedZones, zones: zoneCardsByZone } })) {
      flashStatus("Add at least one card in a selected zone before decrypting.");
      return;
    }

    const updatedContext: GameContext = { ...gameContext, zones: zoneCardsByZone };
    const payload = buildAskAiRequest(question, updatedContext);
    const stackSize = zoneCardsByZone.stack?.length ?? 0;
    const finalQuestion = payload.question;

    await submitAttempt({
      source: "retry",
      payload,
      stackSize,
      finalQuestion,
      usedFallbackQuestion: question.trim().length === 0
    });
  }

  async function handleFollowUp(text: string): Promise<void> {
    await submitFollowUp(text);
  }

  let content: JSX.Element;

  if (flowStep === "game-context") {
    content = (
      <PageShell>
          <StagedStepHeader stepName="Game context" onBrandClick={() => setBrandClickCount((c) => c + 1)} />
          {showCatEasterEgg && (
            <div className="p-2 text-center">
              {emptyStateImageFailed ? (
                <p className="text-2xl font-semibold text-zinc-200">Cat wizard</p>
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
          <div className="panel-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Players in game</p>
            <p className="text-xs text-zinc-400">2 players start at 20 life. 3+ players default to 40 life.</p>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={playersDetailsExpanded ? "Hide player details" : "Show player details"}
                  aria-expanded={playersDetailsExpanded}
                  onClick={() => setPlayersDetailsExpanded((current) => !current)}
                  className="motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 min-w-[2.4rem] text-sm text-zinc-200 transition hover:bg-zinc-700/80"
                >
                  {playersDetailsExpanded ? "▾" : "▸"}
                </button>
                <span className="text-sm font-semibold text-zinc-100">
                  {activePlayerCount} {activePlayerCount === 1 ? "player" : "players"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Add player"
                  onClick={addPlayer}
                  disabled={activePlayerCount >= MAX_PLAYERS}
                  className="motion-hover motion-press motion-focus rounded-lg border border-accent/50 bg-accent/10 px-4 py-1.5 min-w-[2.75rem] text-xs font-semibold text-accent-soft transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label="Remove last player"
                  onClick={removePlayer}
                  disabled={activePlayerCount <= MIN_PLAYERS}
                  className="motion-hover motion-press motion-focus rounded-lg border border-zinc-500 bg-zinc-800/70 px-4 py-1.5 min-w-[2.75rem] text-xs font-semibold text-zinc-100 transition hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  −
                </button>
              </div>
            </div>

            {playersDetailsExpanded && (
              <div className="space-y-2">
                {activePlayers.map((player) => (
                  <div
                    key={player}
                    className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2 text-sm"
                  >
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                        {player} name
                      </span>
                      <input
                        aria-label={`${player} display name`}
                        value={displayNamesByPlayer[player]}
                        onChange={(event) => updateDisplayName(player, event.target.value)}
                        className="motion-focus rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-zinc-100"
                      />
                    </label>
                    <label className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <span className="font-medium text-zinc-100">Life total</span>
                      <input
                        aria-label={`${player} life total`}
                        value={lifeTotalsByPlayer[player]}
                        onChange={(event) => updateLifeTotal(player, event.target.value)}
                        inputMode="numeric"
                        className="motion-focus w-28 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-right font-semibold text-zinc-100"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Turn phase</span>
                <select
                  aria-label="Turn phase"
                  value={turnPhase}
                  onChange={(event) => setTurnPhase(event.target.value as TurnPhase)}
                  className="motion-focus rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                  {TURN_PHASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Active player</span>
                <select
                  aria-label="Active player"
                  value={activePlayer}
                  onChange={(event) => setActivePlayer(event.target.value as PlayerLabel)}
                  className="motion-focus rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                  {activePlayers.map((player) => (
                    <option key={player} value={player}>
                      {formatPlayerDisplayLabel(player, displayNamesByPlayer[player])}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {turnPhase === "combat" && (
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Combat step</span>
                <select
                  aria-label="Combat step"
                  value={combatStep}
                  onChange={(event) => setCombatStep(event.target.value as CombatStep)}
                  className="motion-focus rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                  {COMBAT_STEP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={confirmGameContext}
            className="motion-hover motion-press motion-focus rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-accent-contrast"
          >
            Confirm game context
          </button>
          {statusMessage && (
            <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent-soft">
              {statusMessage}
            </p>
          )}
      </PageShell>
    );
  } else if (flowStep === "zone-confirm") {
    const canContinueZones = canAdvance("zone-confirm", {
      gameContext: { selectedZones, turnPhase }
    });

    content = (
      <ZoneConfirmStep
        selectedZones={selectedZones}
        canContinue={canContinueZones}
        onZoneToggle={(zone) =>
          setSelectedZones((current) =>
            current.includes(zone) ? current.filter((z) => z !== zone) : [...current, zone]
          )
        }
        onBack={() => {
          const previousStep = getPreviousStep("zone-confirm");
          if (previousStep) {
            setFlowStep(previousStep);
          }
        }}
        onContinue={confirmZoneSelection}
        statusMessage={statusMessage}
      />
    );
  } else if (flowStep === "zone-collection") {
    const canContinueCollection = canAdvance("zone-collection", {
      gameContext: { selectedZones, zones: zoneCardsByZone }
    });

    content = (
      <ZoneCollectionStep
        selectedZones={selectedZones}
        zones={zoneCardsByZone}
        onZonesChange={setZoneCardsByZone}
        cardMetadata={cardMetadata}
        isMetadataLoading={isMetadataLoading}
        activePlayer={activePlayer}
        activePlayers={activePlayers}
        displayNamesByPlayer={displayNamesByPlayer}
        onBack={() => {
          const previousStep = getPreviousStep("zone-collection");
          if (previousStep) {
            setFlowStep(previousStep);
          }
        }}
        onContinue={finishZoneCollection}
        canContinue={canContinueCollection}
        onFlashStatus={flashStatus}
        statusMessage={statusMessage}
      />
    );
  } else {
    content = (
      <EnrichmentStep
        gameContext={gameContext}
        zones={zoneCardsByZone}
        onZonesChange={setZoneCardsByZone}
        activePlayers={activePlayers}
        question={question}
        onQuestionChange={setQuestion}
        onDecryptStack={handleDecryptStack}
        onBack={() => {
          const previousStep = getPreviousStep("enrichment");
          if (previousStep) {
            setFlowStep(previousStep);
          }
        }}
        canDecrypt={canAdvance("enrichment", {
          gameContext: { selectedZones, zones: zoneCardsByZone }
        })}
        isSubmitting={isSubmitting}
        answer={answer}
        error={error}
        canRetry={canRetry}
        retryCountdown={retryCountdown}
        onRetry={handleRetry}
        statusMessage={statusMessage}
        isConversationActive={isConversationActive}
        isFollowUpSubmitting={isFollowUpSubmitting}
        visibleMessages={visibleMessages}
        frozenGameContext={frozenGameContext}
        onFollowUp={handleFollowUp}
        onStartOver={startOver}
      />
    );
  }

  return (
    <>
      <div className="fixed right-3 top-3 z-30">
        <ThemeControl paletteId={paletteId} onSelect={setPalette} density={density} onDensityChange={setDensity} />
      </div>
      <div key={flowStep} className="motion-enter">
        {content}
      </div>
    </>
  );
}
