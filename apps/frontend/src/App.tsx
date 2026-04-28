import { FormEvent, useEffect, useState } from "react";
import { BattlefieldStep } from "./components/BattlefieldStep";
import { StackBuilderStep } from "./components/StackBuilderStep";
import { logFrontendDebug } from "./lib/debugLogger";
import { apiBaseUrl } from "./lib/env";
import { NO_MATCH_COPY } from "./lib/search";
import { useAskAiSubmitOrchestration } from "./lib/useAskAiSubmitOrchestration";
import { useAutocompleteKeyboard } from "./lib/useAutocompleteKeyboard";
import { useAutocompleteSuggestions } from "./lib/useAutocompleteSuggestions";
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
  AskAiRequest,
  BattlefieldContextItem,
  CardMetadataItem,
  GameContext,
  PlayerLabel,
  StackItem,
  StackTarget
} from "./types";

const RETRY_COOLDOWN_SECONDS = 13;
const METADATA_URL = "/data/cardMetadata.json";
const EMPTY_STATE_IMAGE_URL = "/assets/cats-homescreen.png";
const MAX_OTHER_TARGET_CHARS = 200;
const PLAYER_OPTIONS: PlayerLabel[] = ["Player 1", "Player 2", "Player 3", "Player 4"];
type TargetKind = StackTarget["kind"];
const TARGET_KIND_OPTIONS: Array<{ value: TargetKind; label: string }> = [
  { value: "stack", label: "Stack target" },
  { value: "battlefield", label: "Battlefield target" },
  { value: "player", label: "Player target" },
  { value: "other", label: "Other target context" },
  { value: "none", label: "No specific target" }
];
type FlowStep = "game-context" | "battlefield-context" | "stack-builder";

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

  if (target.kind === "other") {
    return `Other: ${target.targetDescription}`;
  }

  return `Stack: ${target.targetCardName}`;
}

export default function App() {
  const [cardMetadata, setCardMetadata] = useState<CardMetadataItem[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [metadataLoadError, setMetadataLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardMetadataItem | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>("game-context");
  const [playerCountInput, setPlayerCountInput] = useState<2 | 3 | 4>(2);
  const [lifeTotalsByPlayer, setLifeTotalsByPlayer] = useState<Record<PlayerLabel, string>>({
    "Player 1": "20",
    "Player 2": "20",
    "Player 3": "20",
    "Player 4": "20"
  });
  const [gameContext, setGameContext] = useState<GameContext | null>(null);
  const [battlefieldContext, setBattlefieldContext] = useState<BattlefieldContextItem[]>([]);
  const [battlefieldSearchInput, setBattlefieldSearchInput] = useState("");
  const [selectedBattlefieldCard, setSelectedBattlefieldCard] = useState<CardMetadataItem | null>(null);
  const [battlefieldEntryName, setBattlefieldEntryName] = useState("");
  const [isBattlefieldEntryNameLinked, setIsBattlefieldEntryNameLinked] = useState(true);
  const [battlefieldEntryDetails, setBattlefieldEntryDetails] = useState("");
  const [battlefieldEntryTargets, setBattlefieldEntryTargets] = useState<StackTarget[]>([]);
  const [battlefieldTargetKind, setBattlefieldTargetKind] = useState<TargetKind>("battlefield");
  const [battlefieldTargetPermanent, setBattlefieldTargetPermanent] = useState("");
  const [battlefieldTargetPlayer, setBattlefieldTargetPlayer] = useState<PlayerLabel>("Player 2");
  const [battlefieldTargetStackName, setBattlefieldTargetStackName] = useState("");
  const [battlefieldTargetStackId, setBattlefieldTargetStackId] = useState("");
  const [battlefieldTargetOtherDescription, setBattlefieldTargetOtherDescription] = useState("");
  const [stack, setStack] = useState<StackItem[]>([]);
  const [entryCaster, setEntryCaster] = useState<PlayerLabel>(DEFAULT_CASTER);
  const [entryContextNotes, setEntryContextNotes] = useState("");
  const [entryManaSpent, setEntryManaSpent] = useState("");
  const [entryTargets, setEntryTargets] = useState<StackTarget[]>([]);
  const [targetKind, setTargetKind] = useState<TargetKind>("stack");
  const [targetStackCardId, setTargetStackCardId] = useState("");
  const [targetBattlefieldName, setTargetBattlefieldName] = useState("");
  const [targetPlayer, setTargetPlayer] = useState<PlayerLabel>("Player 2");
  const [targetOtherDescription, setTargetOtherDescription] = useState("");
  const [detailTargetKindByCardId, setDetailTargetKindByCardId] = useState<Record<string, TargetKind>>({});
  const [detailStackTargetByCardId, setDetailStackTargetByCardId] = useState<Record<string, string>>({});
  const [detailBattlefieldByCardId, setDetailBattlefieldByCardId] = useState<Record<string, string>>({});
  const [detailPlayerByCardId, setDetailPlayerByCardId] = useState<Record<string, PlayerLabel>>({});
  const [detailOtherByCardId, setDetailOtherByCardId] = useState<Record<string, string>>({});
  const [showStackDetails, setShowStackDetails] = useState(false);
  const [question, setQuestion] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

  const suggestions = useAutocompleteSuggestions({
    cards: cardMetadata,
    query: searchInput
  });
  const battlefieldSuggestions = useAutocompleteSuggestions({
    cards: cardMetadata,
    query: battlefieldSearchInput
  });
  const stackKeyboard = useAutocompleteKeyboard({
    query: searchInput,
    suggestions,
    onSelect: selectStackSuggestion
  });
  const battlefieldKeyboard = useAutocompleteKeyboard({
    query: battlefieldSearchInput,
    suggestions: battlefieldSuggestions,
    onSelect: selectBattlefieldSuggestion
  });

  const addButtonLabel = stack.length === 0 ? "Begin stackening!" : "Add to Stack";
  const activePlayers = PLAYER_OPTIONS.slice(0, playerCountInput);
  const { answer, error, isSubmitting, retryCountdown, canRetry, submitAttempt } = useAskAiSubmitOrchestration({
    apiBaseUrl,
    retryCooldownSeconds: RETRY_COOLDOWN_SECONDS
  });

  useEffect(() => {
    if (!isBattlefieldEntryNameLinked) {
      return;
    }
    setBattlefieldEntryName(battlefieldSearchInput);
  }, [battlefieldSearchInput, isBattlefieldEntryNameLinked]);

  function parseManaSpentInput(rawValue: string): number | undefined {
    const trimmed = rawValue.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return undefined;
    }

    return parsed;
  }

  function flashStatus(message: string): void {
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === message ? null : current));
    }, 1400);
  }

  function resetEntryContext(): void {
    setEntryCaster(DEFAULT_CASTER);
    setEntryContextNotes("");
    setEntryManaSpent("");
    setEntryTargets([]);
    setTargetKind("stack");
    setTargetStackCardId("");
    setTargetBattlefieldName("");
    setTargetPlayer("Player 2");
    setTargetOtherDescription("");
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

    if (targetKind === "other") {
      const targetDescription = targetOtherDescription.trim();
      if (targetDescription.length === 0) return;
      setEntryTargets((current) => [
        ...current,
        {
          kind: "other",
          targetDescription
        }
      ]);
      setTargetOtherDescription("");
      return;
    }

    setEntryTargets((current) => [...current, { kind: "none" }]);
  }

  function removeEntryTarget(indexToRemove: number): void {
    setEntryTargets((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function updateLifeTotal(player: PlayerLabel, value: string): void {
    setLifeTotalsByPlayer((current) => ({
      ...current,
      [player]: value
    }));
  }

  function confirmGameContext(): void {
    const players = activePlayers.map((player) => {
      const parsed = Number(lifeTotalsByPlayer[player]);
      return {
        label: player,
        lifeTotal: Number.isFinite(parsed) ? parsed : NaN
      };
    });

    if (players.some((player) => Number.isNaN(player.lifeTotal))) {
      flashStatus("Enter numeric life totals for each active player.");
      return;
    }

    setGameContext({
      playerCount: playerCountInput,
      players
    });
    logFrontendDebug("game_context.confirmed", {
      playerCount: playerCountInput
    });
    setFlowStep("battlefield-context");
    flashStatus("Game context saved.");
  }

  function addBattlefieldTarget(): void {
    if (battlefieldTargetKind === "battlefield") {
      const targetPermanent = battlefieldTargetPermanent.trim();
      if (targetPermanent.length === 0) return;
      setBattlefieldEntryTargets((current) => [...current, { kind: "battlefield", targetPermanent }]);
      setBattlefieldTargetPermanent("");
      return;
    }

    if (battlefieldTargetKind === "player") {
      setBattlefieldEntryTargets((current) => [...current, { kind: "player", targetPlayer: battlefieldTargetPlayer }]);
      return;
    }

    if (battlefieldTargetKind === "stack") {
      const targetCardName = battlefieldTargetStackName.trim();
      const targetCardId = battlefieldTargetStackId.trim() || targetCardName.toLowerCase().replace(/\s+/g, "-");
      if (targetCardName.length === 0 || targetCardId.length === 0) return;
      setBattlefieldEntryTargets((current) => [...current, { kind: "stack", targetCardId, targetCardName }]);
      setBattlefieldTargetStackName("");
      setBattlefieldTargetStackId("");
      return;
    }

    if (battlefieldTargetKind === "other") {
      const targetDescription = battlefieldTargetOtherDescription.trim();
      if (targetDescription.length === 0) return;
      setBattlefieldEntryTargets((current) => [...current, { kind: "other", targetDescription }]);
      setBattlefieldTargetOtherDescription("");
      return;
    }

    setBattlefieldEntryTargets((current) => [...current, { kind: "none" }]);
  }

  function removeBattlefieldTarget(targetIndexToRemove: number): void {
    setBattlefieldEntryTargets((current) => current.filter((_, index) => index !== targetIndexToRemove));
  }

  function addBattlefieldEntry(): void {
    const name = battlefieldEntryName.trim();
    if (name.length === 0) {
      return;
    }

    const details = battlefieldEntryDetails.trim();
    setBattlefieldContext((current) => [
      ...current,
      {
        name,
        details: details.length > 0 ? details : undefined,
        targets: battlefieldEntryTargets
      }
    ]);
    setBattlefieldSearchInput("");
    setSelectedBattlefieldCard(null);
    setBattlefieldEntryName("");
    setIsBattlefieldEntryNameLinked(true);
    setBattlefieldEntryDetails("");
    setBattlefieldEntryTargets([]);
    flashStatus("Battlefield context added.");
  }

  function selectBattlefieldSuggestion(card: CardMetadataItem): void {
    setSelectedBattlefieldCard(card);
    setBattlefieldEntryName(card.name);
    setIsBattlefieldEntryNameLinked(false);
    if (battlefieldEntryDetails.trim().length === 0) {
      setBattlefieldEntryDetails(card.oracleText.slice(0, 280));
    }
  }

  function selectStackSuggestion(card: CardMetadataItem): void {
    setSelectedCard(card);
    resetEntryContext();
    logFrontendDebug("card.preview_selected", {
      cardId: card.cardId,
      cardName: card.name
    });
  }

  function progressFromBattlefieldStep(): void {
    const progression = battlefieldContext.length > 0 ? "continued" : "skipped";
    logFrontendDebug("battlefield_context.progressed", {
      progression,
      battlefieldEntryCount: battlefieldContext.length
    });
    if (battlefieldContext.length === 0) {
      setBattlefieldContext([]);
    }
    setFlowStep("stack-builder");
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

  function getDetailOther(cardId: string): string {
    return detailOtherByCardId[cardId] ?? "";
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

    if (kind === "other") {
      const targetDescription = getDetailOther(cardId).trim();
      if (targetDescription.length === 0) return;
      addTargetToStackEntry(cardId, {
        kind: "other",
        targetDescription
      });
      setDetailOtherByCardId((current) => ({ ...current, [cardId]: "" }));
      return;
    }

    addTargetToStackEntry(cardId, { kind: "none" });
  }

  function handleAddSelectedCard(): void {
    if (!selectedCard) return;

    const stackEntry = buildStackItemFromMetadata(selectedCard, {
      caster: entryCaster,
      contextNotes: entryContextNotes,
      targets: entryTargets,
      manaSpent: parseManaSpentInput(entryManaSpent)
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
    setDetailOtherByCardId((current) => {
      const next = { ...current };
      delete next[cardId];
      return next;
    });
  }

  async function handleDecryptStack(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (stack.length === 0) {
      flashStatus("Add at least one card before decrypting.");
      return;
    }

    if (!gameContext) {
      flashStatus("Confirm game context before decrypting.");
      return;
    }

    const finalQuestion = getFinalQuestion(question);
    const payload: AskAiRequest = buildAskAiRequest(question, gameContext, battlefieldContext, stack);
    await submitAttempt({
      source: "decrypt",
      payload,
      stackSize: stack.length,
      finalQuestion,
      usedFallbackQuestion: question.trim().length === 0
    });
  }

  async function handleRetry(): Promise<void> {
    if (!canRetry || stack.length === 0 || !gameContext) return;
    const finalQuestion = getFinalQuestion(question);
    await submitAttempt({
      source: "retry",
      payload: buildAskAiRequest(question, gameContext, battlefieldContext, stack),
      stackSize: stack.length,
      finalQuestion,
      usedFallbackQuestion: question.trim().length === 0
    });
  }

  if (flowStep === "game-context") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-6 text-slate-100">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 md:p-6">
          <header>
            <h1 className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              TheJudge
            </h1>
            <p className="text-sm text-slate-300">Stack Assistant</p>
          </header>
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
          <h2 className="text-2xl font-semibold text-sky-300">Game context</h2>
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
            Number of players
            <select
              aria-label="Number of players"
              value={playerCountInput}
              onChange={(event) => setPlayerCountInput(Number(event.target.value) as 2 | 3 | 4)}
              className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <div className="space-y-2">
            {activePlayers.map((player) => (
              <label key={player} className="flex items-center justify-between gap-3 text-sm">
                <span>{player} life total</span>
                <input
                  aria-label={`${player} life total`}
                  value={lifeTotalsByPlayer[player]}
                  onChange={(event) => updateLifeTotal(player, event.target.value)}
                  inputMode="numeric"
                  className="w-28 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-right"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={confirmGameContext}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Confirm game context
          </button>
          {statusMessage && (
            <p className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-200">
              {statusMessage}
            </p>
          )}
        </section>
      </main>
    );
  }

  if (flowStep === "battlefield-context") {
    return (
      <BattlefieldStep
        searchInput={battlefieldSearchInput}
        onSearchInputChange={setBattlefieldSearchInput}
        onSearchKeyDown={battlefieldKeyboard.handleKeyDown}
        showSuggestions={battlefieldSearchInput.trim().length >= 3 && battlefieldKeyboard.isOpen}
        isMetadataLoading={isMetadataLoading}
        suggestions={battlefieldSuggestions}
        noMatchCopy={NO_MATCH_COPY}
        activeSuggestionIndex={battlefieldKeyboard.activeIndex}
        onSuggestionHover={battlefieldKeyboard.setActiveIndex}
        onSuggestionSelect={(card) => {
          selectBattlefieldSuggestion(card);
          battlefieldKeyboard.closeSuggestions();
        }}
        selectedCard={selectedBattlefieldCard}
        battlefieldEntryName={battlefieldEntryName}
        battlefieldEntryDetails={battlefieldEntryDetails}
        onBattlefieldEntryDetailsChange={setBattlefieldEntryDetails}
        targetKind={battlefieldTargetKind}
        onTargetKindChange={setBattlefieldTargetKind}
        targetKindOptions={TARGET_KIND_OPTIONS}
        targetStackName={battlefieldTargetStackName}
        onTargetStackNameChange={setBattlefieldTargetStackName}
        targetStackId={battlefieldTargetStackId}
        onTargetStackIdChange={setBattlefieldTargetStackId}
        targetPermanent={battlefieldTargetPermanent}
        onTargetPermanentChange={setBattlefieldTargetPermanent}
        targetPlayer={battlefieldTargetPlayer}
        onTargetPlayerChange={setBattlefieldTargetPlayer}
        targetOtherDescription={battlefieldTargetOtherDescription}
        onTargetOtherDescriptionChange={setBattlefieldTargetOtherDescription}
        activePlayers={activePlayers}
        maxOtherTargetChars={MAX_OTHER_TARGET_CHARS}
        onAddTarget={addBattlefieldTarget}
        targets={battlefieldEntryTargets}
        formatTarget={formatTarget}
        onRemoveTarget={removeBattlefieldTarget}
        onAddBattlefieldItem={addBattlefieldEntry}
        onProgress={progressFromBattlefieldStep}
        progressLabel={battlefieldContext.length > 0 ? "Continue to stack" : "Skip battlefield context"}
        battlefieldContext={battlefieldContext}
        statusMessage={statusMessage}
      />
    );
  }

  return (
    <StackBuilderStep
      gameContext={gameContext}
      battlefieldContextCount={battlefieldContext.length}
      cardMetadataCount={cardMetadata.length}
      isMetadataLoading={isMetadataLoading}
      metadataLoadError={metadataLoadError}
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      onSearchKeyDown={stackKeyboard.handleKeyDown}
      showSuggestions={searchInput.trim().length >= 3 && stackKeyboard.isOpen}
      suggestions={suggestions}
      noMatchCopy={NO_MATCH_COPY}
      activeSuggestionIndex={stackKeyboard.activeIndex}
      onSuggestionHover={stackKeyboard.setActiveIndex}
      onSuggestionSelect={(card) => {
        selectStackSuggestion(card);
        stackKeyboard.closeSuggestions();
      }}
      selectedCard={selectedCard}
      playerOptions={PLAYER_OPTIONS}
      entryCaster={entryCaster}
      onEntryCasterChange={setEntryCaster}
      targetKind={targetKind}
      onTargetKindChange={setTargetKind}
      targetKindOptions={TARGET_KIND_OPTIONS}
      targetStackCardId={targetStackCardId}
      onTargetStackCardIdChange={setTargetStackCardId}
      stack={stack}
      targetBattlefieldName={targetBattlefieldName}
      onTargetBattlefieldNameChange={setTargetBattlefieldName}
      targetPlayer={targetPlayer}
      onTargetPlayerChange={setTargetPlayer}
      targetOtherDescription={targetOtherDescription}
      onTargetOtherDescriptionChange={setTargetOtherDescription}
      maxOtherTargetChars={MAX_OTHER_TARGET_CHARS}
      onAddEntryTarget={addEntryTarget}
      entryTargets={entryTargets}
      formatTarget={formatTarget}
      onRemoveEntryTarget={removeEntryTarget}
      entryManaSpent={entryManaSpent}
      onEntryManaSpentChange={setEntryManaSpent}
      entryContextNotes={entryContextNotes}
      onEntryContextNotesChange={setEntryContextNotes}
      addButtonLabel={addButtonLabel}
      onAddSelectedCard={handleAddSelectedCard}
      question={question}
      onQuestionChange={setQuestion}
      onDecryptStack={handleDecryptStack}
      isSubmitting={isSubmitting}
      statusMessage={statusMessage}
      error={error}
      canRetry={canRetry}
      retryCountdown={retryCountdown}
      onRetry={handleRetry}
      answer={answer}
      showStackDetails={showStackDetails}
      onShowStackDetailsChange={setShowStackDetails}
      onRemoveFromStack={removeFromStack}
      onUpdateStackEntry={updateStackEntry}
      parseManaSpentInput={parseManaSpentInput}
      getDetailTargetKind={getDetailTargetKind}
      onDetailTargetKindChange={(cardId, kind) =>
        setDetailTargetKindByCardId((current) => ({
          ...current,
          [cardId]: kind
        }))
      }
      detailStackTargetByCardId={detailStackTargetByCardId}
      onDetailStackTargetChange={(cardId, value) =>
        setDetailStackTargetByCardId((current) => ({
          ...current,
          [cardId]: value
        }))
      }
      detailBattlefieldByCardId={detailBattlefieldByCardId}
      onDetailBattlefieldChange={(cardId, value) =>
        setDetailBattlefieldByCardId((current) => ({
          ...current,
          [cardId]: value
        }))
      }
      getDetailPlayer={getDetailPlayer}
      onDetailPlayerChange={(cardId, value) =>
        setDetailPlayerByCardId((current) => ({
          ...current,
          [cardId]: value
        }))
      }
      getDetailOther={getDetailOther}
      onDetailOtherChange={(cardId, value) =>
        setDetailOtherByCardId((current) => ({
          ...current,
          [cardId]: value
        }))
      }
      onAddTargetFromStackDetails={addTargetFromStackDetails}
      onRemoveTargetFromStackEntry={removeTargetFromStackEntry}
    />
  );
}
