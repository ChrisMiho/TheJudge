import type { GamePlayerContext, PlayerLabel } from "../types";

export function formatPlayerDisplayLabel(label: PlayerLabel, displayName?: string): string {
  const trimmedDisplayName = displayName?.trim() ?? "";
  if (trimmedDisplayName.length === 0 || trimmedDisplayName === label) {
    return label;
  }

  return `${label} (${trimmedDisplayName})`;
}

export function buildPlayerDisplayNameMap(players: GamePlayerContext[]): Record<PlayerLabel, string | undefined> {
  return players.reduce<Record<PlayerLabel, string | undefined>>(
    (accumulator, player) => ({
      ...accumulator,
      [player.label]: player.displayName
    }),
    {} as Record<PlayerLabel, string | undefined>
  );
}
