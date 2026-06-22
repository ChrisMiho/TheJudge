// stabilizer.ts -- temporal lock-in for the card scanner.
//
// Per-frame identification is noisy: the warp wobbles, and the loose match
// threshold lets near-random candidates surface, so the raw top-1 jitters from
// frame to frame. This module votes the top-1 identity across a short rolling
// window and only "locks in" when one card is consistently the confident best.
//
// Pure and framework-free: it consumes the engine's Candidate[] (see types.ts)
// so it is unit-testable with synthetic sequences -- no camera, no decode.

import type { Candidate } from "./types";

export type StabilizerConfig = {
  /** Frames retained in the rolling window. */
  windowSize: number;
  /** Top-1 agreement (votes for one card within the window) needed to lock. */
  minVotes: number;
  /** A frame only votes if its best distance is <= this (tight confidence gate). */
  lockDistance: number;
  /** Best must beat the first DISTINCT runner-up by >= this to count as a vote. */
  marginMin: number;
};

export const DEFAULT_STABILIZER_CONFIG: StabilizerConfig = {
  windowSize: 6,
  minVotes: 4,
  lockDistance: 78,
  marginMin: 10
};

export type StabilizerState =
  | { phase: "searching"; topCardId: string | null; votes: number }
  | { phase: "locked"; cardId: string; bestDistance: number };

/** A single window slot: a confident vote for a card, or an abstention (null). */
type Vote = { cardId: string; distance: number } | null;

/**
 * Decide whether a frame casts a confident vote. A frame votes for its top-1
 * card only when (a) the best distance clears the confidence gate AND (b) the
 * best is clearly ahead of the first candidate belonging to a *different* card.
 * Otherwise it abstains (still consumes a window slot, so noise dilutes votes
 * rather than letting a flicker accumulate).
 */
function evaluateFrame(candidates: Candidate[], config: StabilizerConfig): Vote {
  if (candidates.length === 0) return null;
  const best = candidates[0];
  if (best.distance > config.lockDistance) return null;

  const runnerUp = candidates.find((c) => c.card_id !== best.card_id);
  if (runnerUp && runnerUp.distance - best.distance < config.marginMin) return null;

  return { cardId: best.card_id, distance: best.distance };
}

export class ScanStabilizer {
  private readonly config: StabilizerConfig;
  private readonly window: Vote[] = [];
  private locked: { cardId: string; bestDistance: number } | null = null;

  constructor(config: Partial<StabilizerConfig> = {}) {
    this.config = { ...DEFAULT_STABILIZER_CONFIG, ...config };
  }

  /** Feed one frame's ranked candidates; returns the current lock-in state. */
  push(candidates: Candidate[]): StabilizerState {
    if (this.locked) {
      return { phase: "locked", cardId: this.locked.cardId, bestDistance: this.locked.bestDistance };
    }

    this.window.push(evaluateFrame(candidates, this.config));
    while (this.window.length > this.config.windowSize) this.window.shift();

    // Tally votes per card_id within the window, tracking each card's best distance.
    const votes = new Map<string, { count: number; bestDistance: number }>();
    for (const vote of this.window) {
      if (!vote) continue;
      const existing = votes.get(vote.cardId);
      if (existing) {
        existing.count += 1;
        existing.bestDistance = Math.min(existing.bestDistance, vote.distance);
      } else {
        votes.set(vote.cardId, { count: 1, bestDistance: vote.distance });
      }
    }

    let leadId: string | null = null;
    let leadCount = 0;
    let leadBest = Infinity;
    for (const [cardId, tally] of votes) {
      if (tally.count > leadCount || (tally.count === leadCount && tally.bestDistance < leadBest)) {
        leadId = cardId;
        leadCount = tally.count;
        leadBest = tally.bestDistance;
      }
    }

    if (leadId !== null && leadCount >= this.config.minVotes) {
      this.locked = { cardId: leadId, bestDistance: leadBest };
      return { phase: "locked", cardId: leadId, bestDistance: leadBest };
    }

    return { phase: "searching", topCardId: leadId, votes: leadCount };
  }

  /** Non-mutating: whether a card is currently locked in. */
  isLocked(): boolean {
    return this.locked !== null;
  }

  /** Clear the window and any lock (called on accept / rescan / close). */
  reset(): void {
    this.window.length = 0;
    this.locked = null;
  }
}
