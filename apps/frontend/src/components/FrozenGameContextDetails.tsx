import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { formatContextTarget, hasOwnerControl } from "../lib/enrichmentFormat";
import { buildPlayerDisplayNameMap, formatPlayerDisplayLabel } from "../lib/playerLabels";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { CombatStep, GameContext, TurnPhase, ZoneCardItem, ZoneId } from "../types";

const TURN_PHASE_LABELS: Record<TurnPhase, string> = {
  untap: "Untap",
  upkeep: "Upkeep",
  draw: "Draw",
  main_1: "Pre Combat Main Phase",
  combat: "Combat",
  main_2: "Post Combat Main Phase",
  end_step: "End Step",
  cleanup: "Cleanup"
};

const COMBAT_STEP_LABELS: Record<CombatStep, string> = {
  beginning_of_combat: "Beginning of Combat",
  declare_attackers: "Declare Attackers",
  declare_blockers: "Declare Blockers",
  combat_damage: "Combat Damage",
  end_of_combat: "End of Combat"
};

type FrozenGameContextDetailsProps = {
  frozenGameContext: GameContext;
  /** REQ-209/REQ-017: when provided, each card row also carries a ✎ "Edit" button
   * jumping back to that card's Context sheet. Used only by the live pre-submit
   * review (EnrichmentStep); the frozen post-answer View Context sheet renders
   * read-only and omits this prop. */
  onEditCard?: (zone: ZoneId, card: ZoneCardItem) => void;
  /**
   * Look-matching pass (slice N), requirement 9: zone filter pills
   * (`in-depth-question.html:410-424` `.review-filters`) that dim every row outside
   * the picked zone. Omitted entirely by the frozen post-answer "View context"
   * dialog — only the live pre-submit review (`EnrichmentStep`) opts in, alongside
   * `onEditCard`, so the read-only dialog keeps rendering zero buttons.
   */
  zoneFilter?: ZoneId | null;
  onZoneFilterChange?: (zone: ZoneId | null) => void;
};

type PopulatedZone = { zone: ZoneId; cards: ZoneCardItem[] };

function getPopulatedZones(frozenGameContext: GameContext): PopulatedZone[] {
  const zones = frozenGameContext.zones ?? {};
  return CANONICAL_ZONE_ORDER
    .map((zone) => ({ zone, cards: zones[zone] ?? [] }))
    .filter(({ cards }) => cards.length > 0);
}

function getPhaseLabel(frozenGameContext: GameContext): string {
  const phaseLabel = TURN_PHASE_LABELS[frozenGameContext.turnPhase];
  if (frozenGameContext.turnPhase !== "combat" || !frozenGameContext.combatStep) {
    return phaseLabel;
  }
  return `${phaseLabel} — ${COMBAT_STEP_LABELS[frozenGameContext.combatStep]}`;
}

export function getFrozenGameContextTriggerLabel(frozenGameContext: GameContext): string {
  const populatedZoneCount = getPopulatedZones(frozenGameContext).length;
  return `${getPhaseLabel(frozenGameContext)} · ${populatedZoneCount} populated ${
    populatedZoneCount === 1 ? "zone" : "zones"
  }`;
}

export function FrozenGameContextDetails({
  frozenGameContext,
  onEditCard,
  zoneFilter,
  onZoneFilterChange
}: FrozenGameContextDetailsProps): JSX.Element {
  const displayNamesByPlayer = buildPlayerDisplayNameMap(frozenGameContext.players ?? []);
  const populatedZones = getPopulatedZones(frozenGameContext);
  const players = frozenGameContext.players ?? [];
  const totalCardCount = populatedZones.reduce((sum, { cards }) => sum + cards.length, 0);

  function formatCardDetailLines(zone: ZoneId, card: ZoneCardItem): string[] {
    const lines: string[] = [];
    if (zone !== "stack" && hasOwnerControl(zone) && card.owner) {
      lines.push(`Owner: ${formatPlayerDisplayLabel(card.owner, displayNamesByPlayer[card.owner])}`);
    }
    if (zone === "stack" && card.caster) {
      lines.push(`Caster: ${formatPlayerDisplayLabel(card.caster, displayNamesByPlayer[card.caster])}`);
    }
    // REQ-210: every zone's card can carry an explicit Mana spent value now, not
    // only the Stack; an untouched box leaves `manaSpent` undefined so this line
    // is simply absent, same as today for a card nobody edited.
    if (card.manaSpent !== undefined) {
      lines.push(`Mana spent: ${card.manaSpent}`);
    }
    // REQ-211: the storm case — copies is Stack-only, sent only above 0.
    if (zone === "stack" && card.copies) {
      lines.push(`+${card.copies} copies`);
    }
    if ((card.targets ?? []).length > 0) {
      lines.push(
        `Targets: ${(card.targets ?? [])
          .map((target) => formatContextTarget(target, displayNamesByPlayer))
          .join("; ")}`
      );
    }
    if (card.contextNotes) {
      lines.push(`Notes: ${card.contextNotes}`);
    }
    return lines;
  }

  return (
    <div className="frozen-game-context-details space-y-4">
      <section className="space-y-1" aria-labelledby="frozen-context-turn">
        <h3
          id="frozen-context-turn"
          className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400"
        >
          Turn
        </h3>
        <p className="text-sm text-zinc-300">{getPhaseLabel(frozenGameContext)}</p>
        {frozenGameContext.activePlayer && (
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-zinc-200">Active player:</span>{" "}
            {formatPlayerDisplayLabel(
              frozenGameContext.activePlayer,
              displayNamesByPlayer[frozenGameContext.activePlayer]
            )}
          </p>
        )}
      </section>

      {players.length > 0 && (
        <section className="space-y-1" aria-labelledby="frozen-context-setup">
          <h3
            id="frozen-context-setup"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400"
          >
            Setup
          </h3>
          <ul className="space-y-0.5 text-sm text-zinc-300">
            {players.map((player) => (
              <li key={player.label}>
                {formatPlayerDisplayLabel(player.label, player.displayName)}: {player.lifeTotal} life
              </li>
            ))}
          </ul>
        </section>
      )}

      {onZoneFilterChange && populatedZones.length > 1 && (
        <div className="review-filters" role="group" aria-label="Pick out a zone's cards">
          <button
            type="button"
            className="review-filter-pill"
            aria-pressed={zoneFilter == null}
            onClick={() => onZoneFilterChange(null)}
          >
            All<b>{totalCardCount}</b>
          </button>
          {populatedZones.map(({ zone, cards }) => (
            <button
              key={zone}
              type="button"
              className="review-filter-pill"
              aria-pressed={zoneFilter === zone}
              onClick={() => onZoneFilterChange(zoneFilter === zone ? null : zone)}
            >
              {ZONE_LABELS[zone]}
              <b>{cards.length}</b>
            </button>
          ))}
        </div>
      )}

      {populatedZones.map(({ zone, cards }) => (
        <section key={zone} className="space-y-2" aria-labelledby={`frozen-context-zone-${zone}`}>
          <h3
            id={`frozen-context-zone-${zone}`}
            className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400"
          >
            {ZONE_LABELS[zone]}
          </h3>
          <ul className="space-y-2">
            {cards.map((card) => (
              <li
                key={`${zone}:${card.instanceId ?? card.cardId}`}
                data-dimmed={zoneFilter != null && zoneFilter !== zone}
                data-hit={zoneFilter != null && zoneFilter === zone}
                className="frozen-context-detail-row context-review-row space-y-1 rounded-xl border border-zinc-700/60 bg-zinc-900/50 p-3 text-sm text-zinc-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-zinc-100">{card.name}</p>
                  {onEditCard && (
                    <button
                      type="button"
                      aria-label={`Edit context for ${card.name}`}
                      onClick={() => onEditCard(zone, card)}
                      className="shrink-0 rounded-lg px-1.5 py-1 text-xs font-semibold text-accent-soft transition hover:text-accent-strong"
                    >
                      ✎ Edit
                    </button>
                  )}
                </div>
                {card.typeLine && <p className="text-xs text-zinc-400">{card.typeLine}</p>}
                {card.oracleText && <p className="text-xs text-zinc-400">{card.oracleText}</p>}
                {formatCardDetailLines(zone, card).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
