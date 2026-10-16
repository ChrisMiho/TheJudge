import { useMemo, useRef, type ReactNode } from "react";
import { buildFeedbackContext } from "./buildFeedbackContext";
import { readEnvironmentSnapshot } from "./environment";
import { FeedbackSeamContext, type FeedbackSeamValue } from "./feedbackSeam";
import type { FeedbackContextContributor, FeedbackFlowSnapshot } from "./types";

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
