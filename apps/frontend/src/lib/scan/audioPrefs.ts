const scanAudioMutedStorageKey = "thejudge.scan.audioMuted";
const mutedSentinel = "1";
const unmutedSentinel = "0";

export function loadScanAudioMuted(): boolean {
  try {
    return localStorage.getItem(scanAudioMutedStorageKey) === mutedSentinel;
  } catch {
    return false;
  }
}

export function saveScanAudioMuted(muted: boolean): void {
  try {
    localStorage.setItem(scanAudioMutedStorageKey, muted ? mutedSentinel : unmutedSentinel);
  } catch {
    // Audio preference persistence must never interfere with scanning.
  }
}
