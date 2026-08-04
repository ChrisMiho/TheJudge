import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FeedbackContextProvider,
  useFeedbackContextReader,
  useRegisterFeedbackContributor
} from "./FeedbackContextProvider";
import type { FeedbackContext, FeedbackContextContributor, FeedbackFlowSnapshot } from "./types";

afterEach(() => {
  cleanup();
  readers = [];
});

let readers: Array<() => FeedbackContext> = [];

function latestReader(): () => FeedbackContext {
  const reader = readers[readers.length - 1];
  if (!reader) {
    throw new Error("No reader captured — the probe did not render.");
  }
  return reader;
}

function ReaderProbe(): null {
  readers.push(useFeedbackContextReader());
  return null;
}

function ContributorProbe({ contributor }: { contributor: FeedbackContextContributor }): null {
  useRegisterFeedbackContributor(contributor);
  return null;
}

interface HarnessProps {
  contributors?: Array<{ key: string; contributor: FeedbackContextContributor }>;
  activeDestinationId?: string | null;
  providerMode?: string;
}

function Harness({
  contributors = [],
  activeDestinationId = "mtg-assistant",
  providerMode = "mock"
}: HarnessProps): JSX.Element {
  return (
    <FeedbackContextProvider activeDestinationId={activeDestinationId} providerMode={providerMode}>
      <ReaderProbe />
      {contributors.map(({ key, contributor }) => (
        <ContributorProbe key={key} contributor={contributor} />
      ))}
    </FeedbackContextProvider>
  );
}

function createFlowSnapshot(): FeedbackFlowSnapshot {
  return {
    screen: "MTG Assistant",
    flowStep: "zone-collection",
    question: "Can I respond to the trigger?",
    selectedZones: ["stack"],
    zoneCards: {
      stack: [{ cardId: "card-1", name: "Lightning Bolt", oracleText: "Deals 3 damage." }]
    },
    conversation: [{ role: "user", content: "Can I respond to the trigger?" }]
  };
}

describe("Frontend - Feedback", () => {
  describe("Feedback context seam", () => {
    it("builds a shell-only snapshot when no contributor is registered", () => {
      render(<Harness />);

      const context = latestReader()();

      expect(context.flow).toBeNull();
      expect(context.activeDestinationId).toBe("mtg-assistant");
      expect(context.providerMode).toBe("mock");
    });

    it("does not throw when read with no contributor registered", () => {
      render(<Harness />);

      expect(() => latestReader()()).not.toThrow();
    });

    it("includes environment fields read at snapshot time", () => {
      render(<Harness />);

      const context = latestReader()();

      expect(context.environment.userAgent).toBe(navigator.userAgent);
      expect(context.environment.viewport).toEqual({
        width: window.innerWidth,
        height: window.innerHeight
      });
      expect(context.environment.buildMode).toBe("test");
      expect(typeof context.environment.timestamp).toBe("number");
      expect(context.environment.capturedAt).toBe(new Date(context.environment.timestamp).toISOString());
    });

    it("returns the registered contributor's flow snapshot", () => {
      render(
        <Harness contributors={[{ key: "mtg", contributor: () => createFlowSnapshot() }]} />
      );

      const context = latestReader()();

      expect(context.flow).toEqual(createFlowSnapshot());
    });

    it("calls the contributor lazily — only when a snapshot is requested", () => {
      const contributor = vi.fn(() => createFlowSnapshot());

      render(<Harness contributors={[{ key: "mtg", contributor }]} />);

      expect(contributor).not.toHaveBeenCalled();

      latestReader()();

      expect(contributor).toHaveBeenCalledTimes(1);
    });

    it("does not mutate the contributed snapshot object", () => {
      const flowSnapshot = createFlowSnapshot();

      render(<Harness contributors={[{ key: "mtg", contributor: () => flowSnapshot }]} />);

      latestReader()();

      expect(flowSnapshot).toEqual(createFlowSnapshot());
    });

    it("returns a fresh snapshot object on every call, never a cached reference", () => {
      const flowSnapshot = createFlowSnapshot();
      render(<Harness contributors={[{ key: "mtg", contributor: () => flowSnapshot }]} />);
      const getFeedbackContext = latestReader();

      const first = getFeedbackContext();
      const second = getFeedbackContext();

      expect(first).not.toBe(second);
      expect(first.flow).not.toBe(second.flow);
      expect(first.flow).not.toBe(flowSnapshot);
      expect(first.flow).toEqual(second.flow);
    });

    it("falls back to the shell-only snapshot after the registering component unmounts", () => {
      const { rerender } = render(
        <Harness contributors={[{ key: "mtg", contributor: () => createFlowSnapshot() }]} />
      );

      expect(latestReader()().flow).toEqual(createFlowSnapshot());

      rerender(<Harness contributors={[]} />);

      expect(latestReader()().flow).toBeNull();
    });

    it("keeps the last-registered contributor when two are mounted", () => {
      const first: FeedbackContextContributor = () => ({ screen: "First" });
      const second: FeedbackContextContributor = () => ({ screen: "Second" });

      render(
        <Harness
          contributors={[
            { key: "first", contributor: first },
            { key: "second", contributor: second }
          ]}
        />
      );

      expect(latestReader()().flow).toEqual({ screen: "Second" });
    });

    it("keeps the newer registration alive when an older contributor unmounts", () => {
      const first: FeedbackContextContributor = () => ({ screen: "First" });
      const second: FeedbackContextContributor = () => ({ screen: "Second" });

      const { rerender } = render(
        <Harness
          contributors={[
            { key: "first", contributor: first },
            { key: "second", contributor: second }
          ]}
        />
      );

      rerender(<Harness contributors={[{ key: "second", contributor: second }]} />);

      expect(latestReader()().flow).toEqual({ screen: "Second" });
    });

    it("invokes the latest closure of an inline contributor without re-registering", () => {
      const { rerender } = render(
        <Harness contributors={[{ key: "mtg", contributor: () => ({ screen: "Before" }) }]} />
      );

      rerender(
        <Harness contributors={[{ key: "mtg", contributor: () => ({ screen: "After" }) }]} />
      );

      expect(latestReader()().flow).toEqual({ screen: "After" });
    });

    it("treats a contributor returning null as no flow in progress", () => {
      render(<Harness contributors={[{ key: "mtg", contributor: () => null }]} />);

      expect(latestReader()().flow).toBeNull();
    });

    it("falls back to the shell-only snapshot when a contributor throws", () => {
      const contributor: FeedbackContextContributor = () => {
        throw new Error("flow state exploded");
      };

      render(<Harness contributors={[{ key: "mtg", contributor }]} />);

      const getFeedbackContext = latestReader();

      expect(() => getFeedbackContext()).not.toThrow();
      expect(getFeedbackContext().flow).toBeNull();
      expect(getFeedbackContext().activeDestinationId).toBe("mtg-assistant");
    });

    it("keeps the reader referentially stable across re-renders", () => {
      const { rerender } = render(<Harness />);

      rerender(<Harness />);

      expect(readers).toHaveLength(2);
      expect(readers[1]).toBe(readers[0]);
    });

    it("reads current shell props through a reader captured before they changed", () => {
      const { rerender } = render(<Harness activeDestinationId="mtg-assistant" providerMode="mock" />);
      const getFeedbackContext = latestReader();

      rerender(<Harness activeDestinationId="trade-balancer" providerMode="openai" />);

      expect(getFeedbackContext().activeDestinationId).toBe("trade-balancer");
      expect(getFeedbackContext().providerMode).toBe("openai");
    });

    it("builds a snapshot without a provider instead of throwing", () => {
      render(<ReaderProbe />);

      const context = latestReader()();

      expect(context.flow).toBeNull();
      expect(context.activeDestinationId).toBeNull();
      expect(context.providerMode).toBe("unknown");
    });
  });
});
