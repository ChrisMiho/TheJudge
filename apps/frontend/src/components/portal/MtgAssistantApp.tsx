import { FormEvent, useEffect, useRef, useState } from "react";
import { ConversationHistoryDrawer } from "../ConversationHistoryDrawer";
import { EnrichmentStep } from "../EnrichmentStep";
import { StagedStepHeader } from "../StagedStepHeader";
import { StepEyebrow } from "../StepEyebrow";
import { ZoneCollectionStep } from "../ZoneCollectionStep";
import { ZoneConfirmStep } from "../ZoneConfirmStep";
import { logFrontendDebug } from "../../lib/debugLogger";
import type { ConversationHistoryEntry, GameDraftState } from "../../lib/conversationHistory/persistence";
import {
  clearDraft,
  loadDraft,
  loadHistoryEntries,
  saveDraft,
  saveHistoryEntry
} from "../../lib/conversationHistory/persistence";
import { apiBaseUrl } from "../../lib/env";
import {
  buildAskAiRequest,
  canAdvance,
  DEFAULT_TURN_PHASE,
  getNextStep,
  getPreviousStep,
  mergeSelectedZonesOnPhaseChange,
  type FlowStepId
} from "../../lib/contextFlow";
import { useRegisterFeedbackContributor } from "../../lib/feedback/FeedbackContextProvider";
import { formatPlayerDisplayLabel } from "../../lib/playerLabels";
import { useAssistantSeed } from "../../lib/portal/seedContext";
import { useAskAiSubmitOrchestration } from "../../hooks/useAskAiSubmitOrchestration";
import { PageShell } from "../PageShell";
import {
  MAX_PLAYER_ROSTER_SIZE,
  MIN_PLAYER_ROSTER_SIZE,
  PlayerRosterEditor,
  type RosterPlayer
} from "../PlayerRosterEditor";
import type {
  CardMetadataItem,
  CombatStep,
  GameContext,
  GamePlayerContext,
  PlayerLabel,
  TurnPhase,
  ZoneCardItem,
  ZoneId
} from "../../types";

const RETRY_COOLDOWN_SECONDS = 13;
const FLOW_LABEL = "In-Depth Question";
const METADATA_URL = "/data/cardMetadata.json";
const EMPTY_STATE_IMAGE_URL = "/assets/cats-homescreen.png";
const MIN_PLAYERS = MIN_PLAYER_ROSTER_SIZE;
const MAX_PLAYERS = MAX_PLAYER_ROSTER_SIZE;
const DUEL_STARTING_LIFE_TOTAL = "20";
const MULTIPLAYER_STARTING_LIFE_TOTAL = "40";
const PLAYER_OPTIONS: PlayerLabel[] = Array.from({ length: MAX_PLAYERS }, (_, index) => `Player ${index + 1}` as PlayerLabel);

type ScalarCounterField = "poison" | "energy" | "experience";

type AssistantNamedCounter = {
  id: string;
  name: string;
  amount: string;
};

type AssistantPlayerCounters = Record<ScalarCounterField, string> & {
  commanderDamage: Partial<Record<PlayerLabel, string>>;
  counters: AssistantNamedCounter[];
};

type AssistantCountersByPlayer = Record<PlayerLabel, AssistantPlayerCounters>;

function createDefaultLifeTotals(): Record<PlayerLabel, string> {
  return PLAYER_OPTIONS.reduce<Record<PlayerLabel, string>>(
    (accumulator, player, index) => ({
      ...accumulator,
      [player]: index < MIN_PLAYERS ? DUEL_STARTING_LIFE_TOTAL : MULTIPLAYER_STARTING_LIFE_TOTAL
    }),
    {} as Record<PlayerLabel, string>
  );
}

function createDefaultDisplayNames(): Record<PlayerLabel, string> {
  return PLAYER_OPTIONS.reduce<Record<PlayerLabel, string>>(
    (accumulator, player) => ({ ...accumulator, [player]: player }),
    {} as Record<PlayerLabel, string>
  );
}

function createEmptyCountersByPlayer(): AssistantCountersByPlayer {
  return PLAYER_OPTIONS.reduce<AssistantCountersByPlayer>(
    (accumulator, player) => ({
      ...accumulator,
      [player]: {
        poison: "",
        energy: "",
        experience: "",
        commanderDamage: {},
        counters: []
      }
    }),
    {} as AssistantCountersByPlayer
  );
}

function parsePositiveInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

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

export interface MtgAssistantAppProps {
  isActive?: boolean;
}

export function MtgAssistantApp({ isActive = true }: MtgAssistantAppProps): JSX.Element {
  const { consumeSeed } = useAssistantSeed();
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [flowStep, setFlowStep] = useState<FlowStepId>("game-context");
  const [activePlayerCount, setActivePlayerCount] = useState(MIN_PLAYERS);
  const [lifeTotalsByPlayer, setLifeTotalsByPlayer] = useState<Record<PlayerLabel, string>>(createDefaultLifeTotals);
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
  const [secondaryDetailsExpanded, setSecondaryDetailsExpanded] = useState(false);
  const [displayNamesByPlayer, setDisplayNamesByPlayer] = useState<Record<PlayerLabel, string>>(createDefaultDisplayNames);
  const [countersByPlayer, setCountersByPlayer] = useState<AssistantCountersByPlayer>(createEmptyCountersByPlayer);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<ConversationHistoryEntry[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [gameDraft, setGameDraft] = useState<GameDraftState | null>(null);

  // DestinationOutlet keeps previously visited destinations mounted. Running after
  // every render lets an already-mounted Assistant atomically take the one-shot seed
  // queued immediately before the portal switches back to it.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- consumeSeed clears synchronously, so state updates cannot loop; checking every render is required for a hidden mounted destination.
  useEffect(() => {
    const seed = consumeSeed();
    if (!seed) return;

    const nextDisplayNames = createDefaultDisplayNames();
    const nextLifeTotals = createDefaultLifeTotals();
    const nextCounters = createEmptyCountersByPlayer();

    for (const player of seed.players) {
      nextDisplayNames[player.label] = player.displayName ?? player.label;
      nextLifeTotals[player.label] = String(player.lifeTotal);
      nextCounters[player.label] = {
        poison: player.poison === undefined ? "" : String(player.poison),
        energy: player.energy === undefined ? "" : String(player.energy),
        experience: player.experience === undefined ? "" : String(player.experience),
        commanderDamage: Object.fromEntries(
          (player.commanderDamage ?? []).map(({ from, amount }) => [from, String(amount)])
        ) as Partial<Record<PlayerLabel, string>>,
        counters: (player.counters ?? []).map((counter, index) => ({
          id: `${player.label.toLowerCase().replace(/ /g, "-")}-seed-counter-${index + 1}`,
          name: counter.name,
          amount: String(counter.amount)
        }))
      };
    }

    setActivePlayerCount(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, seed.playerCount)));
    setDisplayNamesByPlayer(nextDisplayNames);
    setLifeTotalsByPlayer(nextLifeTotals);
    setCountersByPlayer(nextCounters);
    setPlayersDetailsExpanded(true);
  });

  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      setSecondaryDetailsExpanded(false);
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  const wasActiveForDraftRef = useRef(isActive);

  function hydrateFromGameDraft(draft: GameDraftState): void {
    setFlowStep(draft.flowStep);
    setGameContext(draft.gameContext);
    setSelectedZones(draft.selectedZones);
    setZoneCardsByZone(draft.zoneCardsByZone);
    setQuestion(draft.question);
    setTurnPhase(draft.turnPhase);
    setCombatStep(draft.combatStep);
    setConfirmedPhase(draft.confirmedPhase);
    setActivePlayer(draft.activePlayer);
  }

  // Mid-flight Draft auto-hydrate (REQ-108 / FLOW-017): this destination mounts once per
  // session (DestinationOutlet keeps it mounted-but-hidden afterward), so a mount-only
  // effect covers exactly the "reload" case FLOW-017 calls out — Menu-leave-and-back within
  // the same session already survives via this component staying mounted in memory.
  useEffect(() => {
    const draft = loadDraft("game");
    if (draft) hydrateFromGameDraft(draft);
  }, []);

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
  const rosterPlayers: RosterPlayer[] = activePlayers.map((player) => ({
    label: player,
    displayName: displayNamesByPlayer[player],
    lifeTotal: lifeTotalsByPlayer[player]
  }));
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
    startOver,
    restoreConversation
  } = useAskAiSubmitOrchestration({
    apiBaseUrl,
    retryCooldownSeconds: RETRY_COOLDOWN_SECONDS,
    onConversationUpdated: (snapshot) => {
      const existing = loadHistoryEntries().find((entry) => entry.id === snapshot.conversationId);
      const now = new Date().toISOString();
      saveHistoryEntry({
        id: snapshot.conversationId,
        mode: "game",
        flowLabel: FLOW_LABEL,
        frozenContext: snapshot.frozenContext,
        hiddenInitialQuestion: snapshot.hiddenInitialQuestion,
        visibleMessages: snapshot.visibleMessages,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
      setActiveConversationId(snapshot.conversationId);
      // First successful Ask AI submit for the attempt: the mid-flight Draft is now a
      // completed history entry (saved just above), so drop the Draft slot (REQ-108).
      clearDraft("game");
    }
  });

  // The single definition of "snapshot whatever mid-flight staging exists right now"
  // (REQ-108). Every mid-flight exit calls this one function rather than restating the
  // staging predicate and Draft payload at each call site — this flow stages ten fields, so
  // two copies would drift the moment one is added, and a drifted copy is exactly how the
  // history-select exit came to be uncovered in the first place.
  //
  // An active answered conversation has its own completed-history entry and no Draft to
  // maintain, so it is a no-op. Empty staging clears rather than writes, so a stale Draft
  // does not outlive the work it described.
  function snapshotMidFlightDraft(): void {
    if (isConversationActive) return;

    const hasStaging =
      flowStep !== "game-context" ||
      gameContext !== null ||
      selectedZones.length > 0 ||
      question.trim().length > 0 ||
      Object.values(zoneCardsByZone).some((cards) => (cards?.length ?? 0) > 0);

    if (hasStaging) {
      saveDraft({
        mode: "game",
        flowStep,
        gameContext,
        selectedZones,
        zoneCardsByZone,
        question,
        turnPhase,
        combatStep,
        confirmedPhase,
        activePlayer
      });
    } else {
      clearDraft("game");
    }
  }

  // Mid-flight Draft snapshot on Menu-leave (FLOW-017's "Menu-leave snapshot"). Reacts only
  // to the isActive true→false edge; other staging fields are read via closure at the time of
  // that transition, not listed as deps, so typing doesn't re-fire this on every keystroke.
  // Uses its own ref (not the shared wasActiveRef above) so effect declaration order can't
  // accidentally consume the edge before this runs.
  useEffect(() => {
    const wasActive = wasActiveForDraftRef.current;
    wasActiveForDraftRef.current = isActive;
    if (!wasActive || isActive) return;

    snapshotMidFlightDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts only to the isActive edge; staging fields are read via closure at fire time, not listed, so typing doesn't re-fire this.
  }, [isActive]);

  // DEC-105/REQ-088: contribute this flow's live slice to a feedback snapshot,
  // lazily — the closure is re-read on every render, so a snapshot taken at any
  // step (game context → zone confirm → collection → enrichment → conversation)
  // reflects that step. Read-only: nothing here mutates flow state. Once the
  // question is submitted the orchestration freezes the context it actually sent,
  // which is the more useful thing to disclose.
  useRegisterFeedbackContributor(() => ({
    screen: "MTG Assistant",
    flowStep,
    gameContext: frozenGameContext ?? gameContext,
    question,
    selectedZones,
    zoneCards: zoneCardsByZone,
    isConversationActive,
    conversation: visibleMessages
  }));

  function flashStatus(message: string): void {
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === message ? null : current));
    }, 1400);
  }

  function toggleOuterRosterDetails(): void {
    setPlayersDetailsExpanded((current) => {
      const next = !current;
      if (!next) {
        setSecondaryDetailsExpanded(false);
      }
      return next;
    });
  }

  function toggleSecondaryDetails(): void {
    setSecondaryDetailsExpanded((current) => !current);
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

  function updateScalarCounter(player: PlayerLabel, field: ScalarCounterField, value: string): void {
    setCountersByPlayer((current) => ({
      ...current,
      [player]: {
        ...current[player],
        [field]: value
      }
    }));
  }

  function updateCommanderDamage(player: PlayerLabel, source: PlayerLabel, value: string): void {
    setCountersByPlayer((current) => ({
      ...current,
      [player]: {
        ...current[player],
        commanderDamage: {
          ...current[player].commanderDamage,
          [source]: value
        }
      }
    }));
  }

  function updateNamedCounter(
    player: PlayerLabel,
    counterId: string,
    field: "name" | "amount",
    value: string
  ): void {
    setCountersByPlayer((current) => ({
      ...current,
      [player]: {
        ...current[player],
        counters: current[player].counters.map((counter) =>
          counter.id === counterId ? { ...counter, [field]: value } : counter
        )
      }
    }));
  }

  function buildPlayers(): GamePlayerContext[] {
    return activePlayers.map((player) => {
      const parsed = Number(lifeTotalsByPlayer[player]);
      const trimmedName = displayNamesByPlayer[player]?.trim() ?? "";
      const displayName = trimmedName.length > 0 && trimmedName !== player ? trimmedName : undefined;
      const builtPlayer: GamePlayerContext = {
        label: player,
        lifeTotal: Number.isFinite(parsed) ? parsed : NaN,
        displayName
      };

      const playerCounters = countersByPlayer[player];
      for (const field of ["poison", "energy", "experience"] as const) {
        const amount = parsePositiveInteger(playerCounters[field]);
        if (amount !== undefined) {
          builtPlayer[field] = amount;
        }
      }

      const commanderDamage = activePlayers.flatMap((source) => {
        if (source === player) return [];
        const amount = parsePositiveInteger(playerCounters.commanderDamage[source] ?? "");
        return amount === undefined ? [] : [{ from: source, amount }];
      });
      if (commanderDamage.length > 0) {
        builtPlayer.commanderDamage = commanderDamage;
      }

      const counters = playerCounters.counters.flatMap((counter) => {
        const name = counter.name.trim();
        const amount = parsePositiveInteger(counter.amount);
        return name.length === 0 || amount === undefined ? [] : [{ name, amount }];
      });
      if (counters.length > 0) {
        builtPlayer.counters = counters;
      }

      return builtPlayer;
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
      flashStatus("Add at least one card by searching or scanning before continuing.");
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
      flashStatus("Add at least one card by searching or scanning before decrypting.");
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
      flashStatus("Add at least one card by searching or scanning before decrypting.");
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

  function handleStartOver(): void {
    startOver();
    setFlowStep("game-context");
    setGameContext(null);
    setSelectedZones([]);
    setZoneCardsByZone({});
    setQuestion("");
    setConfirmedPhase(undefined);
    setTurnPhase(DEFAULT_TURN_PHASE);
    setCombatStep("declare_blockers");
    setActivePlayer("Player 1");
    setStatusMessage(null);
    setActiveConversationId(null);
  }

  function openHistory(): void {
    setHistoryEntries(loadHistoryEntries("game"));
    setGameDraft(loadDraft("game"));
    setIsHistoryOpen(true);
  }

  function handleSelectHistoryEntry(entry: ConversationHistoryEntry): void {
    // Opening a saved conversation is the third mid-flight exit (DEC-138), alongside
    // Menu-leave and reload. It never changes `isActive` — this destination stays mounted
    // and active — so the edge effect above cannot see it, and without this call
    // restoreConversation would overwrite staged work with nothing recoverable. Snapshot
    // first, then restore, so the staged attempt reappears as the Draft row in the same
    // drawer the user is already looking at. Silent by design: no dialog, no notice.
    snapshotMidFlightDraft();
    restoreConversation(entry);
    setActiveConversationId(entry.id);
    setIsHistoryOpen(false);
    // The restored conversation only renders inside EnrichmentStep, so selecting an entry
    // from any earlier staged step (game-context, zone-confirm, zone-collection) has to
    // move the flow there as well. Without this the drawer closed onto the step the user
    // was already on — the conversation looked like it never opened — and then ambushed
    // them with someone else's thread the moment they walked the flow forward to
    // enrichment on their own. Quick Question has no equivalent bug: its whole screen is
    // gated on `isConversationActive`, so restoring is enough there. (DEC-124)
    setFlowStep("enrichment");
  }

  function handleSelectDraft(draft: GameDraftState): void {
    hydrateFromGameDraft(draft);
    setIsHistoryOpen(false);
  }

  let content: JSX.Element;

  if (flowStep === "game-context") {
    content = (
      <PageShell>
          <StagedStepHeader
            onBrandClick={() => setBrandClickCount((c) => c + 1)}
            historyTrigger={{ onOpen: openHistory }}
          />
          <StepEyebrow stepName="Game context" />
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
            <p className="text-xs text-zinc-400">Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.</p>

            <PlayerRosterEditor
              players={rosterPlayers}
              playerCount={activePlayerCount}
              isExpanded={playersDetailsExpanded}
              onToggleExpanded={toggleOuterRosterDetails}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onDisplayNameChange={updateDisplayName}
              onLifeTotalChange={updateLifeTotal}
              showLifeTotals
              secondaryDetailsExpanded={secondaryDetailsExpanded}
              onToggleSecondaryDetails={toggleSecondaryDetails}
              renderPlayerExtras={(player) => {
                const playerCounters = countersByPlayer[player.label];
                return (
                  <div className="space-y-3 border-t border-zinc-700/70 pt-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {(["poison", "energy", "experience"] as const).map((field) => (
                        <label key={field} className="flex flex-col gap-1">
                          <span className="text-xs font-semibold capitalize text-zinc-300">{field}</span>
                          <input
                            aria-label={`${player.label} ${field}`}
                            value={playerCounters[field]}
                            onChange={(event) => updateScalarCounter(player.label, field, event.target.value)}
                            inputMode="numeric"
                            className="motion-focus rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-right font-semibold text-zinc-100"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                        Commander damage
                      </p>
                      {activePlayers
                        .filter((source) => source !== player.label)
                        .map((source) => (
                          <label key={source} className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <span className="text-zinc-300">From {source}</span>
                            <input
                              aria-label={`${player.label} commander damage from ${source}`}
                              value={playerCounters.commanderDamage[source] ?? ""}
                              onChange={(event) =>
                                updateCommanderDamage(player.label, source, event.target.value)
                              }
                              inputMode="numeric"
                              className="motion-focus w-28 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-right font-semibold text-zinc-100"
                            />
                          </label>
                        ))}
                    </div>

                    {playerCounters.counters.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                          Named counters
                        </p>
                        {playerCounters.counters.map((counter) => {
                          const accessibleName = counter.name.trim() || counter.id;
                          return (
                            <div key={counter.id} className="grid grid-cols-[1fr_auto] gap-2">
                              <input
                                aria-label={`${player.label} counter ${accessibleName} name`}
                                value={counter.name}
                                onChange={(event) =>
                                  updateNamedCounter(player.label, counter.id, "name", event.target.value)
                                }
                                className="motion-focus min-w-0 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-zinc-100"
                              />
                              <input
                                aria-label={`${player.label} counter ${accessibleName} amount`}
                                value={counter.amount}
                                onChange={(event) =>
                                  updateNamedCounter(player.label, counter.id, "amount", event.target.value)
                                }
                                inputMode="numeric"
                                className="motion-focus w-28 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-right font-semibold text-zinc-100"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
          <div className="panel-inner ambient-accent-surface ambient-accent-interactive">
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
        historyTrigger={{ onOpen: openHistory }}
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
        historyTrigger={{ onOpen: openHistory }}
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
        onStartOver={handleStartOver}
        historyTrigger={{ onOpen: openHistory }}
      />
    );
  }

  return (
    <div key={flowStep} className="motion-enter">
      {content}
      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={historyEntries}
        activeConversationId={activeConversationId}
        onSelectEntry={handleSelectHistoryEntry}
        draft={gameDraft ? { updatedAt: gameDraft.updatedAt, onSelect: () => handleSelectDraft(gameDraft) } : null}
      />
    </div>
  );
}
