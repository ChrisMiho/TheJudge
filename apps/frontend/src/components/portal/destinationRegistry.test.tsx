import { describe, expect, it, vi } from "vitest";
import { isValidElement, Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { lazyDestination, PORTAL_DESTINATIONS, startBackgroundDownload } from "./destinationRegistry";

describe("Frontend - Portal", () => {
describe("PORTAL_DESTINATIONS", () => {
  // Order is both the menu's rendered order and the default active destination, since
  // `loadActiveDestinationId` falls back to the first id.
  it("registers the portal destinations in order, led by Quick Question", () => {
    expect(PORTAL_DESTINATIONS.map((destination) => destination.id)).toEqual([
      "quick-lookup",
      "mtg-assistant",
      "player-life-tracker",
      "trade-balancer"
    ]);
    expect(PORTAL_DESTINATIONS.map((destination) => destination.label)).toEqual([
      "Quick Question",
      "In-Depth Question",
      "Life Tracker",
      "Trade Balancer"
    ]);
  });

  it("each destination's render(isActive) returns a node for both activity values", () => {
    for (const destination of PORTAL_DESTINATIONS) {
      expect(isValidElement(destination.render(true))).toBe(true);
      expect(isValidElement(destination.render(false))).toBe(true);
    }
  });
});

describe("startBackgroundDownload (NFR-014 tiers 2 and 3)", () => {
  function makePreloaders(calls: string[]): Record<string, () => Promise<unknown>> {
    return Object.fromEntries(
      PORTAL_DESTINATIONS.map((destination) => [
        destination.id,
        () => {
          calls.push(destination.id);
          return Promise.resolve();
        }
      ])
    );
  }

  it("calls the loader of every other destination and not the landing one", () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => [] }) as unknown as Response));
    const calls: string[] = [];

    startBackgroundDownload("player-life-tracker", makePreloaders(calls));

    expect(calls).toEqual(["quick-lookup", "mtg-assistant", "trade-balancer"]);
    vi.unstubAllGlobals();
  });

  it("makes every tier-2 call before the tier-3 card-list request, and sends no health ping", () => {
    const events: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      events.push(`fetch:${String(input)}`);
      return { ok: true, status: 200, json: async () => [] } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const preloaders = Object.fromEntries(
      PORTAL_DESTINATIONS.map((destination) => [
        destination.id,
        () => {
          events.push(`preload:${destination.id}`);
          return Promise.resolve();
        }
      ])
    );

    startBackgroundDownload("quick-lookup", preloaders);

    expect(events).toEqual([
      "preload:mtg-assistant",
      "preload:player-life-tracker",
      "preload:trade-balancer",
      "fetch:/data/cardMetadata.json"
    ]);
    expect(events.some((event) => event.includes("/api/health"))).toBe(false);
    vi.unstubAllGlobals();
  });

  it("runs once per page load", () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => [] }) as unknown as Response));
    const calls: string[] = [];
    const preloaders = makePreloaders(calls);

    startBackgroundDownload("quick-lookup", preloaders);
    startBackgroundDownload("quick-lookup", preloaders);
    startBackgroundDownload("player-life-tracker", preloaders);

    expect(calls).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("swallows a failed download silently", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const preloaders = Object.fromEntries(
      PORTAL_DESTINATIONS.map((destination) => [destination.id, () => Promise.reject(new Error("chunk"))])
    );

    expect(() => startBackgroundDownload("quick-lookup", preloaders)).not.toThrow();
    await Promise.resolve();
    vi.unstubAllGlobals();
  });
});

describe("lazyDestination", () => {
  function Tool(): JSX.Element {
    return <p>Tool on screen</p>;
  }

  it("clears the cached promise on a rejected preload so a later tap loads and shows the tool", async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Tool }>>()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce({ default: Tool });
    const destination = lazyDestination(load);

    await expect(destination.preload()).rejects.toThrow("chunk failed");

    const Lazy = destination.Component;
    render(
      <Suspense fallback={<p>Loading…</p>}>
        <Lazy />
      </Suspense>
    );

    expect(await screen.findByText("Tool on screen")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("renders a destination whose code already arrived without the Loading fallback", async () => {
    const destination = lazyDestination(async () => ({ default: Tool }));
    await destination.preload();

    const Lazy = destination.Component;
    render(
      <Suspense fallback={<p>Loading…</p>}>
        <Lazy />
      </Suspense>
    );

    expect(screen.getByText("Tool on screen")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("shows Loading only until an in-flight download lands, with exactly one request for the chunk", async () => {
    let finish: (module: { default: typeof Tool }) => void = () => undefined;
    const load = vi.fn(
      () =>
        new Promise<{ default: typeof Tool }>((resolve) => {
          finish = resolve;
        })
    );
    const destination = lazyDestination(load);
    void destination.preload();

    const Lazy = destination.Component;
    render(
      <Suspense fallback={<p>Loading…</p>}>
        <Lazy />
      </Suspense>
    );

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    finish({ default: Tool });
    await waitFor(() => expect(screen.getByText("Tool on screen")).toBeInTheDocument());
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
});
