import { describe, expect, it } from "vitest";
import type { Candidate } from "../types";
import { ScanStabilizer } from "../stabilizer";
import { SCAN_STABILIZER_CONFIG } from "../tuning";

// A confident frame: best card clearly ahead of a distinct runner-up, under lockDistance.
function confident(cardId: string, distance = 30): Candidate[] {
  return [
    { card_id: cardId, distance },
    { card_id: `${cardId}-other`, distance: distance + 60 }
  ];
}

function pushN(stab: ScanStabilizer, frames: Candidate[][]) {
  let state = stab.push(frames[0]);
  for (let i = 1; i < frames.length; i++) state = stab.push(frames[i]);
  return state;
}

describe("ScanStabilizer", () => {
  it("locks after minVotes consecutive confident frames for one card", () => {
    const stab = new ScanStabilizer();
    expect(stab.push(confident("alpha")).phase).toBe("searching");
    expect(stab.push(confident("alpha")).phase).toBe("searching");
    expect(stab.push(confident("alpha")).phase).toBe("searching");
    const locked = stab.push(confident("alpha"));
    expect(locked.phase).toBe("locked");
    if (locked.phase === "locked") {
      expect(locked.cardId).toBe("alpha");
      expect(locked.bestDistance).toBeLessThanOrEqual(30);
    }
  });

  it("reports the best (minimum) winning-frame distance on lock", () => {
    const stab = new ScanStabilizer();
    stab.push(confident("alpha", 40));
    stab.push(confident("alpha", 22));
    stab.push(confident("alpha", 35));
    const locked = stab.push(confident("alpha", 30));
    expect(locked.phase).toBe("locked");
    if (locked.phase === "locked") expect(locked.bestDistance).toBe(22);
  });

  it("never locks on pure noise (distances above lockDistance)", () => {
    const stab = new ScanStabilizer();
    let state = stab.push([]);
    for (let i = 0; i < 20; i++) {
      state = stab.push([
        { card_id: `noise-${i}`, distance: 120 },
        { card_id: `noise-${i}-b`, distance: 122 }
      ]);
    }
    expect(state.phase).toBe("searching");
  });

  it("never locks when two cards alternate as top-1", () => {
    const stab = new ScanStabilizer();
    let state = stab.push(confident("alpha"));
    for (let i = 0; i < 20; i++) {
      state = stab.push(confident(i % 2 === 0 ? "beta" : "alpha"));
    }
    expect(state.phase).toBe("searching");
  });

  it("does not lock on a weak-but-correct stream (distance just over lockDistance)", () => {
    const stab = new ScanStabilizer({ lockDistance: 78 });
    let state = stab.push(confident("alpha", 79));
    for (let i = 0; i < 10; i++) state = stab.push(confident("alpha", 79));
    expect(state.phase).toBe("searching");
  });

  it("does not lock when the runner-up is within marginMin", () => {
    const stab = new ScanStabilizer({ marginMin: 10 });
    let state = stab.push([
      { card_id: "alpha", distance: 30 },
      { card_id: "beta", distance: 35 }
    ]);
    for (let i = 0; i < 10; i++) {
      state = stab.push([
        { card_id: "alpha", distance: 30 },
        { card_id: "beta", distance: 35 }
      ]);
    }
    expect(state.phase).toBe("searching");
  });

  it("counts a vote only against the first DISTINCT runner-up, not a closer same-card printing", () => {
    // A second candidate sharing the best card_id (alt printing) must NOT block the margin check.
    const stab = new ScanStabilizer();
    const frames: Candidate[][] = Array.from({ length: 4 }, () => [
      { card_id: "alpha", distance: 30 },
      { card_id: "alpha", distance: 31 }, // same card, closer than the distinct runner-up
      { card_id: "beta", distance: 95 }
    ]);
    expect(pushN(stab, frames).phase).toBe("locked");
  });

  it("reset() clears accumulated votes and any lock", () => {
    const stab = new ScanStabilizer();
    pushN(stab, Array.from({ length: 4 }, () => confident("alpha")));
    stab.reset();
    expect(stab.push(confident("alpha")).phase).toBe("searching");
  });

  it("stays locked once locked, even if later frames disagree", () => {
    const stab = new ScanStabilizer();
    pushN(stab, Array.from({ length: 4 }, () => confident("alpha")));
    const still = stab.push(confident("beta"));
    expect(still.phase).toBe("locked");
    if (still.phase === "locked") expect(still.cardId).toBe("alpha");
  });

  it("tracks the leading candidate while still searching", () => {
    const stab = new ScanStabilizer();
    const state = stab.push(confident("alpha"));
    expect(state.phase).toBe("searching");
    if (state.phase === "searching") {
      expect(state.topCardId).toBe("alpha");
      expect(state.votes).toBe(1);
    }
  });

  describe("search progress report", () => {
    it("reports accumulating votes and needed votes before locking", () => {
      const stab = new ScanStabilizer();

      for (let votes = 1; votes <= 3; votes++) {
        expect(stab.push(confident("alpha"))).toMatchObject({
          phase: "searching",
          topCardId: "alpha",
          votes,
          votesNeeded: 4
        });
      }

      expect(stab.push(confident("alpha"))).toMatchObject({ phase: "locked", cardId: "alpha" });
    });

    it("reports progress without locking on ambiguous or noisy input", () => {
      const alternating = new ScanStabilizer();
      for (let i = 0; i < 20; i++) {
        expect(alternating.push(confident(i % 2 === 0 ? "alpha" : "beta"))).toMatchObject({
          phase: "searching",
          votesNeeded: 4
        });
      }

      const noisy = new ScanStabilizer();
      for (let i = 0; i < 20; i++) {
        expect(noisy.push(confident("alpha", 79))).toMatchObject({
          phase: "searching",
          votesNeeded: 4
        });
      }
    });

    it("exposes additive per-frame metrics (best / runner-up / margin) without affecting gating", () => {
      const stab = new ScanStabilizer();
      const state = stab.push([
        { card_id: "alpha", distance: 30 },
        { card_id: "beta", distance: 95 }
      ]);
      expect(state.phase).toBe("searching");
      if (state.phase === "searching") {
        expect(state.bestCardId).toBe("alpha");
        expect(state.bestDistance).toBe(30);
        expect(state.runnerUpCardId).toBe("beta");
        expect(state.runnerUpDistance).toBe(95);
        expect(state.margin).toBe(65);
        // Pure: one confident frame must not have locked.
        expect(state.votes).toBe(1);
      }
    });

    it("reports the distinct runner-up, skipping a closer same-card printing, in metrics", () => {
      const stab = new ScanStabilizer();
      const state = stab.push([
        { card_id: "alpha", distance: 30 },
        { card_id: "alpha", distance: 31 },
        { card_id: "beta", distance: 95 }
      ]);
      if (state.phase === "searching") {
        expect(state.runnerUpCardId).toBe("beta");
        expect(state.margin).toBe(65);
      }
    });

    it("null metrics on an empty frame, and no lock", () => {
      const stab = new ScanStabilizer();
      const state = stab.push([]);
      expect(state.phase).toBe("searching");
      if (state.phase === "searching") {
        expect(state.bestCardId).toBeNull();
        expect(state.bestDistance).toBeNull();
        expect(state.runnerUpCardId).toBeNull();
        expect(state.runnerUpDistance).toBeNull();
        expect(state.margin).toBeNull();
      }
    });

    it("reports the leading card from the current window", () => {
      const stab = new ScanStabilizer();

      stab.push(confident("beta"));
      stab.push(confident("alpha"));
      const state = stab.push(confident("alpha"));

      expect(state).toMatchObject({
        phase: "searching",
        topCardId: "alpha",
        votes: 2,
        votesNeeded: 4
      });
    });
  });

  describe("scanner tuning config", () => {
    it("locks after three confident votes retained across the longer scanner window", () => {
      const stab = new ScanStabilizer(SCAN_STABILIZER_CONFIG);

      expect(stab.push(confident("alpha"))).toMatchObject({
        phase: "searching",
        topCardId: "alpha",
        votes: 1,
        votesNeeded: 3
      });

      for (let i = 0; i < 9; i++) {
        expect(stab.push([])).toMatchObject({ phase: "searching", votesNeeded: 3 });
      }

      expect(stab.push(confident("alpha"))).toMatchObject({
        phase: "searching",
        topCardId: "alpha",
        votes: 2,
        votesNeeded: 3
      });
      expect(stab.push(confident("alpha"))).toMatchObject({ phase: "locked", cardId: "alpha" });
    });
  });
});
