import type { FeedbackContext, FeedbackEnvironmentSnapshot, FeedbackFlowSnapshot } from "./types";

export interface BuildFeedbackContextInput {
  /** `null` when no feature has registered a contributor, or it declined to contribute. */
  flowSnapshot: FeedbackFlowSnapshot | null;
  /** "mock" when the frontend is pointed at the mock ask-ai provider. */
  providerMode: string;
  /** Portal destination active when feedback was opened. */
  activeDestinationId: string | null;
  environment: FeedbackEnvironmentSnapshot;
}

/**
 * Pure merge of the contributed flow slice with shell + environment fields into
 * the snapshot disclosed to the user and serialized into `appState`.
 *
 * Purity contract (DEC-105): the same input produces a deep-equal output on
 * every call, nothing is read from module or global state, and neither the input
 * nor any object reachable from it is mutated. Data reachable from the input is
 * deep-copied so a later mutation of live flow state cannot retroactively change
 * an already-built snapshot.
 */
export function buildFeedbackContext(input: BuildFeedbackContextInput): FeedbackContext {
  return {
    activeDestinationId: input.activeDestinationId,
    providerMode: input.providerMode,
    environment: deepCopy(input.environment),
    flow: input.flowSnapshot === null ? null : deepCopy(input.flowSnapshot)
  };
}

/**
 * Structural copy for the JSON-shaped data a snapshot carries. Anything that is
 * not a plain object or array (primitives, and any exotic value a contributor
 * hands over) passes through by reference — the snapshot is serialized to JSON
 * downstream, so only plain structures need isolating.
 */
function deepCopy<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepCopy(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      copy[key] = deepCopy(entry);
    }
    return copy as T;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
