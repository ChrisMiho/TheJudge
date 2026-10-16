import { formatContextTarget, hasOwnerControl } from "../lib/enrichmentFormat";
import { buildPlayerDisplayNameMap, formatPlayerDisplayLabel } from "../lib/playerLabels";
import { ZONE_LABELS } from "../lib/zoneLabels";
import type { GameContext, ZoneCardItem, ZoneId } from "../types";
import { getPhaseLabel, getPopulatedZones } from "./frozenGameContextTriggerLabel";

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
        <h3 id="frozen-context-turn" className="frozen-heading">
          Turn
        </h3>
        <p className="frozen-line">{getPhaseLabel(frozenGameContext)}</p>
        {frozenGameContext.activePlayer && (
          <p className="frozen-line">
            <span className="frozen-strong">Active player:</span>{" "}
            {formatPlayerDisplayLabel(
              frozenGameContext.activePlayer,
              displayNamesByPlayer[frozenGameContext.activePlayer]
            )}
          </p>
        )}
      </section>

      {players.length > 0 && (
        <section className="space-y-1" aria-labelledby="frozen-context-setup">
          <h3 id="frozen-context-setup" className="frozen-heading">
            Setup
          </h3>
          <ul className="frozen-line space-y-0.5">
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
          <button type="button" aria-pressed={zoneFilter == null}
            onClick={() => onZoneFilterChange(null)}
          >
            All<b>{totalCardCount}</b>
          </button>
          {populatedZones.map(({ zone, cards }) => (
            <button
              key={zone}
              type="button"
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
          <h3 id={`frozen-context-zone-${zone}`} className="frozen-heading">
            {ZONE_LABELS[zone]}
          </h3>
          <ul className="space-y-2">
            {cards.map((card) => (
              <li
                key={`${zone}:${card.instanceId ?? card.cardId}`}
                data-dimmed={zoneFilter != null && zoneFilter !== zone}
                data-hit={zoneFilter != null && zoneFilter === zone}
                className="frozen-context-detail-row context-review-row space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="frozen-card-name">{card.name}</p>
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
                {card.typeLine && <p className="frozen-muted">{card.typeLine}</p>}
                {card.oracleText && <p className="frozen-muted">{card.oracleText}</p>}
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
