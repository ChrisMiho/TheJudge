import type { ZoneCardItem, ZoneId } from "../../types";
import type { FeedbackContext, FeedbackFlowSnapshot } from "./types";

/**
 * One `label: value` row of the human-readable disclosure the user can expand in
 * the feedback modal (REQ-087). Structured rather than pre-joined strings so the
 * modal can render a definition list without re-parsing text.
 */
export interface FeedbackSummaryLine {
  label: string;
  value: string;
}

const NONE = "none";
const UNKNOWN = "unknown";

/**
 * Renders a `FeedbackContext` as the human-readable summary shown to the user
 * (REQ-087). It is a pure projection of the snapshot that Slice C serializes
 * into `appState` (REQ-088) — the modal builds one snapshot and feeds it to both
 * this function and `JSON.stringify`, so what the user reads and what is
 * delivered always describe the same capture.
 *
 * Nothing here reads global state or mutates its input.
 */
export function summarizeFeedbackContext(context: FeedbackContext): FeedbackSummaryLine[] {
  const { environment, flow } = context;

  const lines: FeedbackSummaryLine[] = [
    { label: "Captured at", value: environment.capturedAt || UNKNOWN },
    { label: "Active view", value: context.activeDestinationId ?? NONE },
    { label: "Provider mode", value: context.providerMode || UNKNOWN },
    { label: "Route", value: environment.route || UNKNOWN },
    {
      label: "Viewport",
      value: `${environment.viewport.width} × ${environment.viewport.height}`
    },
    { label: "Build", value: `${environment.buildMode || UNKNOWN} (app ${environment.appVersion || UNKNOWN})` },
    { label: "Browser", value: environment.userAgent || UNKNOWN }
  ];

  if (flow === null) {
    lines.push({ label: "Flow state", value: "no feature contributed a snapshot" });
    return lines;
  }

  return [...lines, ...summarizeFlow(flow)];
}

function summarizeFlow(flow: FeedbackFlowSnapshot): FeedbackSummaryLine[] {
  const lines: FeedbackSummaryLine[] = [
    { label: "Screen", value: flow.screen?.trim() || UNKNOWN },
    { label: "Flow step", value: flow.flowStep?.trim() || UNKNOWN },
    { label: "Question", value: flow.question?.trim() || "(not yet written)" },
    { label: "Selected zones", value: joinOrNone(flow.selectedZones) },
    { label: "Cards collected", value: summarizeZoneCards(flow.zoneCards) },
    {
      label: "Conversation",
      value: summarizeConversation(flow.isConversationActive, flow.conversation?.length ?? 0)
    }
  ];

  const gameContext = flow.gameContext;
  if (gameContext) {
    lines.push({
      label: "Game context",
      value: `${gameContext.playerCount} players, turn phase ${gameContext.turnPhase}`
    });
  } else {
    lines.push({ label: "Game context", value: "not assembled yet" });
  }

  return lines;
}

function joinOrNone(values: readonly string[] | undefined): string {
  if (!values || values.length === 0) {
    return NONE;
  }

  return values.join(", ");
}

function summarizeZoneCards(zoneCards: Partial<Record<ZoneId, ZoneCardItem[]>> | undefined): string {
  if (!zoneCards) {
    return NONE;
  }

  const parts = Object.entries(zoneCards)
    .map(([zone, cards]) => ({ zone, count: cards?.length ?? 0 }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.zone} ${entry.count}`);

  return parts.length === 0 ? NONE : parts.join(", ");
}

function summarizeConversation(isActive: boolean | undefined, messageCount: number): string {
  const state = isActive ? "active" : "not started";
  return `${state}, ${messageCount} ${messageCount === 1 ? "message" : "messages"}`;
}
