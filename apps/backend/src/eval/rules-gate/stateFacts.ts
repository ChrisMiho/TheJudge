// REQ-222: the state-fact check. For a case that carries a `gameState`, every
// fact the ruling depends on must appear in the assembled prompt as the line
// the prompt prints for it. The fact-to-line mapping (A15):
//
//   zone a card is in        a `ZONE:` section header per populated zone
//   stack order              `Stack item N (...)` then `card: <name>`, bottom first
//   who cast a stack item    `caster: <player>` (stack items only)
//   who owns a card          `owner: <player>` (every zone but the stack)
//   what a card targets      `targets:` naming each target
//   who controls it          `contextNotes: <note>` (there is no controller field)
//   phase, active player,    `turnPhase:`, `activePlayer:`, one life line per
//   life totals              player, and the phase guidance for the phase
//
// The expected lines are written out here, independent of the formatter that
// prints them, so the check cannot pass by construction. The `.mjs` case
// loader refuses an `owner` on a stack item and a `caster` off the stack, so
// every fact a case states is one of these printed lines.

import type { GoldCase } from "../../../../../scripts/lib/gold-cases.mjs";
import { getPhaseGuidance } from "../../prompt/phaseGuidance.js";

type Player = { label?: string; displayName?: string; lifeTotal?: number };
type Target = { kind?: string; targetPlayer?: string; cardName?: string; targetDescription?: string };
type ZoneCard = {
  cardId?: string;
  name?: string;
  caster?: string;
  owner?: string;
  targets?: Target[];
  contextNotes?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function playerRef(label: string | undefined, players: Player[]): string {
  if (!label) return "(none)";
  const displayName = players.find((player) => player.label === label)?.displayName?.trim() ?? "";
  return displayName.length === 0 || displayName === label ? label : `${label} (${displayName})`;
}

const BLOCK_END =
  /\n\n(?:Stack item \d+ \(|[A-Z][a-z]+ \d+\nname: |ZONE: |[A-Z][A-Z0-9 ()/&:,'.-]{5,}(?:\n|$))/;

/** The text of one printed card block: from its header to the next block or section header. */
function blockFrom(promptText: string, start: number): string {
  const rest = promptText.slice(start + 1);
  const end = rest.search(BLOCK_END);
  return promptText.slice(start, end >= 0 ? start + 1 + end : promptText.length);
}

function expectedTargetFragments(targets: Target[] | undefined, players: Player[]): string[] {
  return (targets ?? []).map((target) => {
    if (target.kind === "none") return "none:does-not-target";
    if (target.kind === "player") return `player:${playerRef(target.targetPlayer, players)}`;
    if (target.kind === "other") return `other:${collapse(target.targetDescription ?? "")}`;
    return collapse(target.cardName ?? "");
  });
}

function checkCardBlock(block: string, card: ZoneCard, players: Player[], where: string, stackItem: boolean): string[] {
  const failures: string[] = [];
  const lines = block.split("\n");
  const hasLine = (line: string) => lines.some((candidate) => collapse(candidate) === collapse(line));

  if (stackItem && card.caster !== undefined && !hasLine(`caster: ${playerRef(card.caster, players)}`)) {
    failures.push(`${where}: missing line "caster: ${playerRef(card.caster, players)}"`);
  }
  if (!stackItem && card.owner !== undefined && !hasLine(`owner: ${playerRef(card.owner, players)}`)) {
    failures.push(`${where}: missing line "owner: ${playerRef(card.owner, players)}"`);
  }
  if (card.contextNotes !== undefined && card.contextNotes.trim().length > 0) {
    if (!hasLine(`contextNotes: ${card.contextNotes}`)) {
      failures.push(`${where}: missing line "contextNotes: ${card.contextNotes}"`);
    }
  }
  const targetLine = lines.find((line) => line.startsWith("targets:"));
  for (const fragment of expectedTargetFragments(card.targets, players)) {
    if (!targetLine || !collapse(targetLine).includes(fragment)) {
      failures.push(`${where}: "targets:" line is missing "${fragment}"`);
    }
  }
  return failures;
}

/**
 * Failures (empty when every stated fact is printed) for one case. A case with
 * no `gameState` has no state facts and always passes.
 */
export function checkStateFacts(caseEntry: GoldCase, promptText: string): string[] {
  const gameState = caseEntry.gameState;
  if (!gameState) return [];
  const failures: string[] = [];
  const players = (gameState.players ?? []) as Player[];
  const promptLines = promptText.split("\n").map(collapse);
  const requireLine = (line: string, what: string) => {
    if (!promptLines.includes(collapse(line))) failures.push(`${what}: missing line "${line}"`);
  };

  requireLine(`turnPhase: ${gameState.turnPhase}`, "turn phase");
  requireLine(`playerCount: ${gameState.playerCount}`, "player count");
  for (const player of players) {
    if (player.label !== undefined && player.lifeTotal !== undefined) {
      const wanted = `${player.label}: lifeTotal=${player.lifeTotal}`;
      if (!promptLines.some((line) => line.startsWith(wanted))) failures.push(`life total: missing line "${wanted}"`);
    }
  }
  if (typeof gameState.activePlayer === "string") {
    requireLine(`activePlayer: ${playerRef(gameState.activePlayer, players)}`, "active player");
  }
  const guidance = getPhaseGuidance(
    gameState.turnPhase as Parameters<typeof getPhaseGuidance>[0],
    gameState.combatStep as Parameters<typeof getPhaseGuidance>[1]
  );
  if (!collapse(promptText).includes(collapse(guidance))) {
    failures.push(`phase guidance for ${gameState.turnPhase}${gameState.combatStep ? ` / ${gameState.combatStep}` : ""} is not in the prompt`);
  }

  const zones = (gameState.zones ?? {}) as Record<string, ZoneCard[] | undefined>;
  for (const [zoneId, cards] of Object.entries(zones)) {
    if (!cards || cards.length === 0) continue;
    if (zoneId === "stack") {
      if (!promptText.includes("ZONE: STACK (BOTTOM TO TOP)")) failures.push('stack: missing "ZONE: STACK (BOTTOM TO TOP)"');
      cards.forEach((card, index) => {
        const where = `stack item ${index + 1} (${card.name ?? card.cardId})`;
        const header = new RegExp(`Stack item ${index + 1} \\([^)\\n]*\\)\\ncard: ${escapeRegExp(card.name ?? "")}\\n`);
        const match = header.exec(promptText);
        if (!match) {
          failures.push(`${where}: "Stack item ${index + 1}" with "card: ${card.name}" is not in the prompt, or the stack order differs`);
          return;
        }
        failures.push(...checkCardBlock(blockFrom(promptText, match.index), card, players, where, true));
      });
      continue;
    }
    const header = `ZONE: ${zoneId.toUpperCase()}`;
    if (!promptText.includes(header)) failures.push(`${zoneId}: missing section header "${header}"`);
    for (const card of cards) {
      const where = `${zoneId} card ${card.name ?? card.cardId}`;
      // Two cards of one name (two Blood Artists with different owners) print two blocks: the card passes
      // when any printed block of that name carries all of its stated facts.
      const matches = [...promptText.matchAll(new RegExp(`\\n[A-Z][a-z]+ \\d+\\nname: ${escapeRegExp(card.name ?? "")}\\n`, "g"))];
      if (matches.length === 0) {
        failures.push(`${where}: "name: ${card.name}" is not in the prompt`);
        continue;
      }
      const attempts = matches.map((match) => checkCardBlock(blockFrom(promptText, match.index + 1), card, players, where, false));
      if (!attempts.some((attempt) => attempt.length === 0)) failures.push(...attempts[0]);
    }
  }
  return failures;
}
