import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { AssistantSeedProvider, useAssistantSeed } from "./seedContext";
import type { RosterSeed } from "../lifeTracker/seed";

afterEach(cleanup);

const firstSeed: RosterSeed = {
  playerCount: 2,
  players: [
    { label: "Player 1", lifeTotal: 33, displayName: "Nissa", poison: 4 },
    { label: "Player 2", lifeTotal: 40 }
  ]
};

const secondSeed: RosterSeed = {
  playerCount: 3,
  players: [
    { label: "Player 1", lifeTotal: 21 },
    { label: "Player 2", lifeTotal: 18 },
    { label: "Player 3", lifeTotal: 40 }
  ]
};

function withProvider({ children }: { children: ReactNode }): JSX.Element {
  return <AssistantSeedProvider>{children}</AssistantSeedProvider>;
}

describe("Frontend - Shared", () => {
  describe("Assistant seed provider", () => {
    it("returns null when nothing has been queued", () => {
      const { result } = renderHook(() => useAssistantSeed(), { wrapper: withProvider });

      expect(result.current.consumeSeed()).toBeNull();
    });

    it("hands the queued seed to the consumer unchanged", () => {
      const { result } = renderHook(() => useAssistantSeed(), { wrapper: withProvider });

      result.current.queueSeed(firstSeed);

      expect(result.current.consumeSeed()).toEqual(firstSeed);
    });

    it("returns null on a second consume of the same seed", () => {
      const { result } = renderHook(() => useAssistantSeed(), { wrapper: withProvider });

      result.current.queueSeed(firstSeed);

      expect(result.current.consumeSeed()).toEqual(firstSeed);
      expect(result.current.consumeSeed()).toBeNull();
      expect(result.current.consumeSeed()).toBeNull();
    });

    it("keeps only the latest of several pending seeds", () => {
      const { result } = renderHook(() => useAssistantSeed(), { wrapper: withProvider });

      result.current.queueSeed(firstSeed);
      result.current.queueSeed(secondSeed);

      expect(result.current.consumeSeed()).toEqual(secondSeed);
      expect(result.current.consumeSeed()).toBeNull();
    });

    it("queues again after a seed was already consumed", () => {
      const { result } = renderHook(() => useAssistantSeed(), { wrapper: withProvider });

      result.current.queueSeed(firstSeed);
      result.current.consumeSeed();
      result.current.queueSeed(secondSeed);

      expect(result.current.consumeSeed()).toEqual(secondSeed);
    });

    it("gives one queued seed to exactly one of two consumers under the same provider", () => {
      const { result } = renderHook(
        () => ({ producer: useAssistantSeed(), consumer: useAssistantSeed() }),
        { wrapper: withProvider }
      );

      result.current.producer.queueSeed(firstSeed);

      expect(result.current.consumer.consumeSeed()).toEqual(firstSeed);
      expect(result.current.producer.consumeSeed()).toBeNull();
    });

    it("keeps the context value stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useAssistantSeed(), { wrapper: withProvider });
      const initialValue = result.current;

      result.current.queueSeed(firstSeed);
      rerender();

      expect(result.current).toBe(initialValue);
      expect(result.current.consumeSeed()).toEqual(firstSeed);
    });
  });

  describe("Assistant seed default context", () => {
    it("returns null without a provider instead of throwing", () => {
      const { result } = renderHook(() => useAssistantSeed());

      expect(result.current.consumeSeed()).toBeNull();
    });

    it("ignores a queued seed without a provider instead of throwing", () => {
      const { result } = renderHook(() => useAssistantSeed());

      expect(() => result.current.queueSeed(firstSeed)).not.toThrow();
      expect(result.current.consumeSeed()).toBeNull();
    });
  });
});
