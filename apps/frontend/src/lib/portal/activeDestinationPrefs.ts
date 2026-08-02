import type { DestinationId } from "./types";

const storageKey = "thejudge.portal.activeDestinationId";

export function loadActiveDestinationId(validIds: readonly DestinationId[]): DestinationId {
  const fallback = validIds[0];
  try {
    const storage = globalThis.sessionStorage;
    if (!storage) return fallback;
    const stored = storage.getItem(storageKey);
    return stored !== null && validIds.includes(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function saveActiveDestinationId(id: DestinationId): void {
  try {
    const storage = globalThis.sessionStorage;
    if (!storage) return;
    storage.setItem(storageKey, id);
  } catch {
    // Destination persistence must never interfere with navigation.
  }
}
