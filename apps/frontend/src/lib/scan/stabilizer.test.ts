import { describe, expect, it } from "vitest";
import type { Candidate } from "./types";
import { ScanStabilizer } from "./stabilizer";

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
});
