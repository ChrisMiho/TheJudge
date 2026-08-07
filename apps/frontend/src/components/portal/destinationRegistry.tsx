import * as React from "react";
import type { PortalDestination } from "../../lib/portal/types";

// Component props intentionally vary by destination; the helper preserves each exact
// component type through T while constraining it to a React component constructor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDestinationComponent = React.ComponentType<any>;

type LazyDestination<T extends AnyDestinationComponent> = {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<{ default: T }>;
};

function lazyDestination<T extends AnyDestinationComponent>(load: () => Promise<{ default: T }>): LazyDestination<T> {
  let loadedModule: { default: T } | undefined;
  let loadPromise: Promise<{ default: T }> | undefined;

  function preload(): Promise<{ default: T }> {
    loadPromise ??= load().then((module) => {
      loadedModule = module;
      return module;
    });
    return loadPromise;
  }

  const Component = React.lazy(() => {
    if (!loadedModule) return preload();

    // React.lazy accepts a thenable. Synchronously resolving an already-preloaded
    // module lets Vitest's legacy immediate post-render assertions stay synchronous;
    // production never preloads, so first visits still suspend on the native import.
    return {
      then(resolve: (module: { default: T }) => void): void {
        resolve(loadedModule as { default: T });
      }
    } as unknown as Promise<{ default: T }>;
  });

  return { Component, preload };
}

const quickLookup = lazyDestination(() =>
  import("./quick-lookup/QuickLookupApp").then((module) => ({ default: module.QuickLookupApp }))
);
const mtgAssistant = lazyDestination(() =>
  import("./MtgAssistantApp").then((module) => ({ default: module.MtgAssistantApp }))
);
const playerLifeTracker = lazyDestination(() =>
  import("./life-tracker/PlayerLifeTrackerApp").then((module) => ({ default: module.PlayerLifeTrackerApp }))
);
const tradeBalancer = lazyDestination(() =>
  import("../trade/TradeBalancer").then((module) => ({ default: module.TradeBalancer }))
);

const QuickLookupApp = quickLookup.Component;
const MtgAssistantApp = mtgAssistant.Component;
const PlayerLifeTrackerApp = playerLifeTracker.Component;
const TradeBalancer = tradeBalancer.Component;

/** Test-runtime seam only: production never calls this, so destination imports stay on demand. */
export async function preloadPortalDestinations(): Promise<void> {
  await Promise.all([
    quickLookup.preload(),
    mtgAssistant.preload(),
    playerLifeTracker.preload(),
    tradeBalancer.preload()
  ]);
}

// Order is the menu's rendered order (DEC-104) *and* the source of the default active
// destination — `loadActiveDestinationId` falls back to the first id when nothing is
// stored for the session. Quick Question leads because it is the fastest path to an
// answer and the most common entry point; In-Depth Question follows.
export const PORTAL_DESTINATIONS: PortalDestination[] = [
  {
    kind: "destination",
    id: "quick-lookup",
    path: "/quick-lookup",
    label: "Quick Question",
    render: (isActive) => <QuickLookupApp isActive={isActive} />
  },
  {
    kind: "destination",
    id: "mtg-assistant",
    path: "/in-depth",
    label: "In-Depth Question",
    render: (isActive) => <MtgAssistantApp isActive={isActive} />
  },
  {
    kind: "destination",
    id: "player-life-tracker",
    path: "/life-tracker",
    label: "Life Tracker",
    render: () => <PlayerLifeTrackerApp />
  },
  {
    kind: "destination",
    id: "trade-balancer",
    path: "/trade-balancer",
    label: "Trade Balancer",
    render: () => <TradeBalancer />
  }
];
