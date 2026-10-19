import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { buildFeedbackContext } from "./buildFeedbackContext";
import { readEnvironmentSnapshot } from "./environment";
import type { FeedbackContext, FeedbackContextContributor } from "./types";

export interface FeedbackSeamValue {
  registerContributor: (contributor: FeedbackContextContributor) => () => void;
  getFeedbackContext: () => FeedbackContext;
}

/**
 * Default seam used when a component renders outside the provider (isolated
 * component tests, storybook-style harnesses). It still returns a valid
 * snapshot — shell fields empty, no flow — so the feedback form never crashes
 * for want of a provider.
 */
const detachedSeam: FeedbackSeamValue = {
  registerContributor: () => () => undefined,
  getFeedbackContext: () =>
    buildFeedbackContext({
      flowSnapshot: null,
      providerMode: "unknown",
      activeDestinationId: null,
      environment: readEnvironmentSnapshot()
    })
};

export const FeedbackSeamContext = createContext<FeedbackSeamValue>(detachedSeam);

/**
 * Registers a feature's lazy snapshot contributor for as long as the calling
 * component is mounted. The last registration wins (v1 has exactly one live
 * flow); unmounting clears it, after which snapshots fall back to shell fields.
 */
export function useRegisterFeedbackContributor(
  contributor: FeedbackContextContributor,
  active = true
): void {
  const { registerContributor } = useContext(FeedbackSeamContext);
  const contributorRef = useRef(contributor);
  contributorRef.current = contributor;

  useEffect(() => {
    // REQ-088: a hidden, still-mounted feature must not describe itself as the
    // screen on view, so it registers only while `active`.
    if (!active) return undefined;
    // Register a stable indirection so a caller passing an inline arrow does not
    // re-register on every render, while still invoking its latest closure.
    return registerContributor(() => contributorRef.current());
  }, [registerContributor, active]);
}

/**
 * Returns a stable `getFeedbackContext()` reader. Calling it builds a fresh
 * snapshot; it never mutates app state and never throws when no contributor is
 * registered.
 */
export function useFeedbackContextReader(): () => FeedbackContext {
  const { getFeedbackContext } = useContext(FeedbackSeamContext);
  return useCallback(() => getFeedbackContext(), [getFeedbackContext]);
}
