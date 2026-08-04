import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { buildFeedbackContext } from "./buildFeedbackContext";
import { readEnvironmentSnapshot } from "./environment";
import type { FeedbackContext, FeedbackContextContributor, FeedbackFlowSnapshot } from "./types";

interface FeedbackSeamValue {
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

const FeedbackSeamContext = createContext<FeedbackSeamValue>(detachedSeam);

export interface FeedbackContextProviderProps {
  activeDestinationId: string | null;
  providerMode: string;
  children: ReactNode;
}

/**
 * Shell-level decoupling seam (DEC-105, REQ-088). The feedback modal asks this
 * provider for a snapshot; it never reaches into any feature's internals.
 * Features push a lazy contributor in the other direction.
 *
 * The contributor lives in a ref, not state: registering must not re-render the
 * tree, and the reader must observe the latest registration synchronously. Shell
 * props are mirrored into refs for the same reason — `getFeedbackContext` stays
 * referentially stable across shell re-renders so consumers can hold it in
 * effect dependency arrays without churn, while still reading current values.
 */
export function FeedbackContextProvider({
  activeDestinationId,
  providerMode,
  children
}: FeedbackContextProviderProps): JSX.Element {
  const contributorRef = useRef<FeedbackContextContributor | null>(null);
  const activeDestinationIdRef = useRef(activeDestinationId);
  const providerModeRef = useRef(providerMode);

  activeDestinationIdRef.current = activeDestinationId;
  providerModeRef.current = providerMode;

  const value = useMemo<FeedbackSeamValue>(
    () => ({
      registerContributor: (contributor: FeedbackContextContributor) => {
        contributorRef.current = contributor;
        return () => {
          // Only clear if still the owner: a newer registration must survive an
          // older component's cleanup (last-registered wins).
          if (contributorRef.current === contributor) {
            contributorRef.current = null;
          }
        };
      },
      getFeedbackContext: () => {
        const contributor = contributorRef.current;
        let flowSnapshot: FeedbackFlowSnapshot | null = null;

        if (contributor) {
          try {
            flowSnapshot = contributor();
          } catch {
            // A failing contributor must never block feedback: fall back to the
            // shell-only snapshot rather than throwing out of the modal.
            flowSnapshot = null;
          }
        }

        return buildFeedbackContext({
          flowSnapshot,
          providerMode: providerModeRef.current,
          activeDestinationId: activeDestinationIdRef.current,
          environment: readEnvironmentSnapshot()
        });
      }
    }),
    []
  );

  return <FeedbackSeamContext.Provider value={value}>{children}</FeedbackSeamContext.Provider>;
}

/**
 * Registers a feature's lazy snapshot contributor for as long as the calling
 * component is mounted. The last registration wins (v1 has exactly one live
 * flow); unmounting clears it, after which snapshots fall back to shell fields.
 */
export function useRegisterFeedbackContributor(contributor: FeedbackContextContributor): void {
  const { registerContributor } = useContext(FeedbackSeamContext);
  const contributorRef = useRef(contributor);
  contributorRef.current = contributor;

  useEffect(() => {
    // Register a stable indirection so a caller passing an inline arrow does not
    // re-register on every render, while still invoking its latest closure.
    return registerContributor(() => contributorRef.current());
  }, [registerContributor]);
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
