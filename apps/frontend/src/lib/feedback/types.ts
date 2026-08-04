import type { ConversationMessage, GameContext, ZoneCardItem, ZoneId } from "../../types";

/**
 * The slice of in-progress flow state a feature contributes to a feedback
 * snapshot. Every field is optional: a flow that has just mounted, or a
 * destination with no flow at all, contributes an empty object rather than
 * forcing callers to invent placeholder values (DEC-105, REQ-088).
 *
 * This is a read-only projection — building a snapshot never mutates the flow.
 */
export interface FeedbackFlowSnapshot {
  /** Human-readable screen the user is on (for example "MTG Assistant"). */
  screen?: string;
  /** Step within the multi-step context flow, when one is in progress. */
  flowStep?: string;
  /** Assembled game context, when the flow has produced one. */
  gameContext?: GameContext | null;
  /** The question the user has typed, verbatim (may be empty). */
  question?: string;
  /** Zones the user selected for collection. */
  selectedZones?: ZoneId[];
  /** Cards collected per zone, including per-card enrichment (targets, notes). */
  zoneCards?: Partial<Record<ZoneId, ZoneCardItem[]>>;
  /** Whether the user has moved past the one-shot question into a conversation. */
  isConversationActive?: boolean;
  /** Conversation history so far, oldest first. */
  conversation?: ConversationMessage[];
}

/**
 * A feature registers one of these with the shell. It is called lazily, only
 * when a snapshot is actually being built, and returns `null` when the feature
 * has nothing meaningful to disclose.
 */
export type FeedbackContextContributor = () => FeedbackFlowSnapshot | null;

/**
 * Impure, environment-derived fields, read at snapshot time by
 * `readEnvironmentSnapshot()`. Kept separate from the pure builder so the
 * builder stays trivially testable.
 */
export interface FeedbackEnvironmentSnapshot {
  userAgent: string;
  viewport: { width: number; height: number };
  route: string;
  /** Epoch milliseconds at which the snapshot was taken. */
  timestamp: number;
  /** ISO-8601 rendering of `timestamp`, for human-readable disclosure. */
  capturedAt: string;
  /** Vite build mode ("development", "production", "test", ...). */
  buildMode: string;
  /** Frontend app version, when one is available at build time. */
  appVersion: string;
}

/**
 * The full disclosed snapshot: shell-level fields, environment fields, and the
 * contributed flow slice. This is exactly what the user sees in the modal's
 * expandable summary and what is JSON-serialized into the `appState` field of
 * the feedback payload — no hidden fields.
 */
export interface FeedbackContext {
  /** Portal destination active when the feedback modal was opened. */
  activeDestinationId: string | null;
  /** "mock" when the frontend is pointed at the mock ask-ai provider. */
  providerMode: string;
  environment: FeedbackEnvironmentSnapshot;
  /** `null` when no feature has registered a contributor. */
  flow: FeedbackFlowSnapshot | null;
}
