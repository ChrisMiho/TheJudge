import * as React from "react";
import { loadCardMetadata } from "../../lib/cardMetadataStore";
import type { PortalDestination } from "../../lib/portal/types";

// Component props intentionally vary by destination; the helper preserves each exact
// component type through T while constraining it to a React component constructor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDestinationComponent = React.ComponentType<any>;

type LazyDestination<T extends AnyDestinationComponent> = {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<{ default: T }>;
};

export function lazyDestination<T extends AnyDestinationComponent>(load: () => Promise<{ default: T }>): LazyDestination<T> {
  let loadedModule: { default: T } | undefined;
  let loadPromise: Promise<{ default: T }> | undefined;

  function preload(): Promise<{ default: T }> {
    loadPromise ??= load().then(
      (module) => {
        loadedModule = module;
        return module;
      },
      (error: unknown) => {
        // A failed download clears the cached promise so a later tap retries.
        loadPromise = undefined;
        throw error;
      }
    );
    return loadPromise;
  }

  const Component = React.lazy(() => {
    if (!loadedModule) return preload();

    // React.lazy accepts a thenable. Synchronously resolving an already-downloaded
    // module means a destination whose code arrived from the background download
    // (NFR-014) never suspends; a tap before the download lands shares the one
    // in-flight import and shows the fallback only until it does.
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

/** Test-runtime seam only: loads every destination before a test file runs so renders stay synchronous. */
export async function preloadPortalDestinations(): Promise<void> {
  await Promise.all([
    quickLookup.preload(),
    mtgAssistant.preload(),
    playerLifeTracker.preload(),
    tradeBalancer.preload()
  ]);
}

const BACKGROUND_PRELOADERS: Record<string, () => Promise<unknown>> = {
  "quick-lookup": quickLookup.preload,
  "mtg-assistant": mtgAssistant.preload,
  "player-life-tracker": playerLifeTracker.preload,
  "trade-balancer": tradeBalancer.preload
};

let backgroundDownloadStarted = false;
let backgroundDownloadTimer: { cancel: () => void } | undefined;

/**
 * NFR-014 tiers 2 and 3. Tier 2: call `preload()` for every registered destination
 * except the landing one (code only — nothing mounts, no tool data is fetched, no
 * health ping). Tier 3: every tier-2 call is made first, then the shared card list
 * starts downloading; tier 3 does not wait for tier 2 to finish. Runs once per page
 * load. A failed download is silent and clears its cached promise, so the tap retries.
 */
export function startBackgroundDownload(
  landingDestinationId: string,
  preloaders: Record<string, () => Promise<unknown>> = BACKGROUND_PRELOADERS
): void {
  if (backgroundDownloadStarted) return;
  backgroundDownloadStarted = true;

  for (const [id, preload] of Object.entries(preloaders)) {
    if (id === landingDestinationId) continue;
    preload().catch(() => undefined);
  }
  loadCardMetadata().catch(() => undefined);
}

/**
 * Run the background download once the landing destination has rendered and the
 * browser is idle (`requestIdleCallback` with a timeout, else a short `setTimeout`).
 */
export function scheduleBackgroundDownload(landingDestinationId: string): void {
  if (backgroundDownloadStarted || backgroundDownloadTimer) return;

  const run = (): void => {
    backgroundDownloadTimer = undefined;
    startBackgroundDownload(landingDestinationId);
  };

  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(run, { timeout: 2000 });
    backgroundDownloadTimer = { cancel: () => window.cancelIdleCallback(handle) };
  } else {
    const handle = setTimeout(run, 200);
    backgroundDownloadTimer = { cancel: () => clearTimeout(handle) };
  }
}

/** Test-only: forget that the background download ran or was scheduled. */
export function resetBackgroundDownloadForTests(): void {
  backgroundDownloadTimer?.cancel();
  backgroundDownloadTimer = undefined;
  backgroundDownloadStarted = false;
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
