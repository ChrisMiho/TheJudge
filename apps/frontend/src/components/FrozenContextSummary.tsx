import { useState } from "react";
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

type FrozenContextSummaryProps = {
  frozenGameContext: GameContext;
};

type PopulatedZone = { zone: ZoneId; cards: ZoneCardItem[] };

/**
 * Read-only presentation of the frozen game context used during an active
 * conversation. Renders a compact summary plus a disclosure that reveals full
 * setup, zone, and enrichment detail. No control here mutates context state.
 */
export function FrozenContextSummary({ frozenGameContext }: FrozenContextSummaryProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const displayNamesByPlayer = buildPlayerDisplayNameMap(frozenGameContext.players ?? []);

  const zones = frozenGameContext.zones ?? {};
  const populatedZones: PopulatedZone[] = CANONICAL_ZONE_ORDER
    .map((zone) => ({ zone, cards: zones[zone] ?? [] }))
    .filter(({ cards }) => cards.length > 0);

  const phaseLabel = TURN_PHASE_LABELS[frozenGameContext.turnPhase];
  const combatStepLabel =
    frozenGameContext.turnPhase === "combat" && frozenGameContext.combatStep
      ? COMBAT_STEP_LABELS[frozenGameContext.combatStep]
      : null;
  const activePlayer = frozenGameContext.activePlayer;
  const players = frozenGameContext.players ?? [];

  function formatCardDetailLines(zone: ZoneId, card: ZoneCardItem): string[] {
    const lines: string[] = [];
    if (zone !== "stack" && hasOwnerControl(zone) && card.owner) {
      lines.push(`Owner: ${formatPlayerDisplayLabel(card.owner, displayNamesByPlayer[card.owner])}`);
    }
    if (zone === "stack" && card.caster) {
      lines.push(`Caster: ${formatPlayerDisplayLabel(card.caster, displayNamesByPlayer[card.caster])}`);
    }
    if (zone === "stack" && card.manaSpent !== undefined) {
      lines.push(`Mana spent: ${card.manaSpent}`);
    }
    if ((card.targets ?? []).length > 0) {
      const formatted = (card.targets ?? [])
        .map((target) => formatContextTarget(target, displayNamesByPlayer))
        .join("; ");
      lines.push(`Targets: ${formatted}`);
    }
    if (card.contextNotes) {
      lines.push(`Notes: ${card.contextNotes}`);
    }
    return lines;
  }

  return (
    <section
      aria-label="Frozen game context"
      className="frozen-context-summary rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Game context (frozen)
          </p>
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-zinc-200">Phase:</span>{" "}
            {combatStepLabel ? `${phaseLabel} — ${combatStepLabel}` : phaseLabel}
          </p>
          {activePlayer && (
            <p className="text-sm text-zinc-300">
              <span className="font-medium text-zinc-200">Active player:</span>{" "}
              {formatPlayerDisplayLabel(activePlayer, displayNamesByPlayer[activePlayer])}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide full game context" : "Show full game context"}
          onClick={() => setExpanded((current) => !current)}
          className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>
      </div>

      {populatedZones.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-zinc-300">
          {populatedZones.map(({ zone, cards }) => (
            <li key={zone}>
              <span className="font-medium text-zinc-200">{ZONE_LABELS[zone]}:</span>{" "}
              {cards.map((card) => card.name).join(", ")}
            </li>
          ))}
        </ul>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-zinc-700/60 pt-4">
          {players.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Setup</p>
              <ul className="space-y-0.5 text-sm text-zinc-300">
                {players.map((player) => (
                  <li key={player.label}>
                    {formatPlayerDisplayLabel(player.label, player.displayName)}: {player.lifeTotal} life
                  </li>
                ))}
              </ul>
            </div>
          )}

          {populatedZones.map(({ zone, cards }) => (
            <div key={zone} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                {ZONE_LABELS[zone]}
              </p>
              <ul className="space-y-2">
                {cards.map((card) => {
                  const detailLines = formatCardDetailLines(zone, card);
                  return (
                    <li
                      key={`${zone}:${card.cardId}`}
                      className="frozen-context-detail-row space-y-1 rounded-xl border border-zinc-700/60 bg-zinc-900/50 p-3 text-sm text-zinc-300"
                    >
                      <p className="font-semibold text-zinc-100">{card.name}</p>
                      {card.typeLine && <p className="text-xs text-zinc-400">{card.typeLine}</p>}
                      {card.oracleText && (
                        <p className="text-xs text-zinc-400">{card.oracleText}</p>
                      )}
                      {detailLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
