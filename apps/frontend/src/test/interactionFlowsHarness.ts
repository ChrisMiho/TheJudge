import { afterEach, beforeEach, vi } from "vitest";

import { clearCardDetailCache } from "../lib/cardDetail";
import type { ZoneAskAiPayload } from "../lib/contextFlow";
import {
  baseCardMetadataFixture,
  getUrlFromRequest,
  jsonResponse,
  normalizeHeaders,
  startOnInDepthQuestion,
  toCardDetail,
  toSlimMetadata,
  type CardFixture
} from "./appTestHelpers";

// `App.interaction-flows*.test.tsx` was one 1300-line file until it became the
// slowest file in the suite and set the floor for coverage sharding. Splitting
// it would have meant copying this harness into every new file, so the harness
// lives here once and each split file installs it.

type AskAiResponse = { status: number; body: unknown; headers?: Record<string, string> };

/**
 * Live ESM binding: reassigned in `beforeEach`, so importers always see the
 * current run's mock without needing an accessor call.
 */
export let fetchMock: ReturnType<typeof vi.fn>;

export const submittedAskAiRequests: ZoneAskAiPayload[] = [];
export const submittedAskAiHeaders: Array<Record<string, string>> = [];

// Referenced by the `vi.mock("./lib/debugLogger", ...)` factory in the split
// files that assert on logging, so all of them share one mock definition.
export const createCorrelationIdMock = vi.fn(() => "corr-test-id");
export const logFrontendDebugMock = vi.fn();

let metadataFixture: CardFixture[] = [];
let askAiResponseQueue: AskAiResponse[] = [];

export function queueAskAiResponses(...responses: AskAiResponse[]): void {
  askAiResponseQueue = responses;
}

export function setMetadataFixture(cards: CardFixture[]): void {
  metadataFixture = cards;
}

export function installInteractionFlowsHarness(): void {
  beforeEach(() => {
    startOnInDepthQuestion();
    clearCardDetailCache();
    metadataFixture = [...baseCardMetadataFixture];
    askAiResponseQueue = [{ status: 200, body: { answer: "Mock answer" } }];
    submittedAskAiRequests.length = 0;
    submittedAskAiHeaders.length = 0;
    createCorrelationIdMock.mockClear();
    logFrontendDebugMock.mockClear();

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = getUrlFromRequest(input);

      if (url === "/data/cardMetadata.json") {
        return jsonResponse(metadataFixture.map(toSlimMetadata));
      }

      // Card-detail popup fetch (REQ-175, FLOW-024): serve the descriptive block
      // from the same fixture the up-front list resolved a card from, matching
      // production's per-oracle-id `GET /api/cards/:oracleId` shape.
      const cardDetailMatch = /\/api\/cards\/([^/?]+)$/.exec(url);
      if (cardDetailMatch && (!init?.method || init.method === "GET")) {
        const oracleId = decodeURIComponent(cardDetailMatch[1]);
        const card = metadataFixture.find((candidate) => candidate.cardId === oracleId);
        if (!card) {
          return jsonResponse({ error: "card_not_found" }, 404);
        }
        return jsonResponse(toCardDetail(card));
      }

      if (url.endsWith("/api/ask-ai") && init?.method === "POST") {
        submittedAskAiRequests.push(JSON.parse(String(init.body)) as ZoneAskAiPayload);
        submittedAskAiHeaders.push(normalizeHeaders(init.headers));

        const nextResponse = askAiResponseQueue.shift() ?? { status: 200, body: { answer: "Mock answer" } };
        return jsonResponse(nextResponse.body, nextResponse.status, nextResponse.headers);
      }

      return jsonResponse({ error: "not found" }, 404);
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
}
