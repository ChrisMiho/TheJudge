import assert from "node:assert/strict";
import test from "node:test";

import { buildCaseRequest } from "./prompt-fidelity.mjs";

const PANHARMONICON = { oracleId: "76678885-3674-443d-b9a2-2a460cf6aac0", name: "Panharmonicon" };
const TARMOGOYF = { oracleId: "45900b2f-f6a9-4c42-9642-008f3c1cf6dd", name: "Tarmogoyf" };

test("buildCaseRequest asks a case that names no real card as the bare question", () => {
  assert.deepEqual(buildCaseRequest({ question: "Does trample need lethal first?", cards: [], gameState: null }), {
    mode: "lookup",
    question: "Does trample need lethal first?"
  });
});

test("buildCaseRequest attaches every cards entry by oracle id, whatever the tier (REQ-185)", () => {
  const request = buildCaseRequest({
    question: "Does Panharmonicon double a Tarmogoyf token's trigger?",
    cards: [PANHARMONICON, TARMOGOYF],
    gameState: null
  });
  assert.deepEqual(request, {
    mode: "lookup",
    question: "Does Panharmonicon double a Tarmogoyf token's trigger?",
    // cardId is the oracle id: the key both the rulings index and the card-detail index resolve by.
    cards: [
      { cardId: PANHARMONICON.oracleId, name: "Panharmonicon" },
      { cardId: TARMOGOYF.oracleId, name: "Tarmogoyf" }
    ]
  });
});

test("buildCaseRequest asks a case with a gameState as an In-Depth game request with its cards in their zones", () => {
  const gameState = {
    playerCount: 2,
    players: [
      { label: "Player 1", lifeTotal: 20 },
      { label: "Player 2", lifeTotal: 20 }
    ],
    turnPhase: "cleanup",
    selectedZones: ["stack", "battlefield"],
    zones: {
      stack: [{ cardId: PANHARMONICON.oracleId, caster: "Player 1" }],
      battlefield: [{ cardId: TARMOGOYF.oracleId, name: "Tarmogoyf", owner: "Player 2" }]
    }
  };
  const request = buildCaseRequest({ question: "Q?", cards: [PANHARMONICON, TARMOGOYF], gameState });
  assert.equal(request.mode, "game");
  assert.equal(request.question, "Q?");
  assert.equal(request.gameContext.turnPhase, "cleanup");
  // A zone card without a name takes it from the attached card; stack order is the stack array's order.
  assert.deepEqual(request.gameContext.zones.stack, [
    { cardId: PANHARMONICON.oracleId, caster: "Player 1", name: "Panharmonicon" }
  ]);
  assert.deepEqual(request.gameContext.zones.battlefield, gameState.zones.battlefield);
  // The case's own gameState is left untouched.
  assert.equal(gameState.zones.stack[0].name, undefined);
});
