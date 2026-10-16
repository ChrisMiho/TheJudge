/*
 * Adaptive fallback for weak hardware. The full-screen scene is GPU paint/
 * composite-bound, not JS-bound — smooth on a strong GPU, "lag central" on a
 * weak one — and no amount of thinning the scene changes that. So after the
 * loop starts we sample ~1.2s of real frame times: if the machine cannot hold
 * ~45fps for the majority of that window, the loop freezes to one still frame
 * (the same resting look reduced-motion gets) instead of animating a janky one.
 */
const PROBE_SLOW_MS = 22; // a frame slower than ~45fps
export const PROBE_MIN_SAMPLES = 20; // need a real window; ignore startup jank
const PROBE_SLOW_FRACTION = 0.5; // majority of the window must be slow
export const PROBE_WINDOW_MS = 1200;

export function shouldFallbackToStatic(frameDurationsMs: number[]): boolean {
  if (frameDurationsMs.length < PROBE_MIN_SAMPLES) return false;
  const slow = frameDurationsMs.filter((d) => d > PROBE_SLOW_MS).length;
  return slow / frameDurationsMs.length > PROBE_SLOW_FRACTION;
}
