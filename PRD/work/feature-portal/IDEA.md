# feature-portal

As TheJudge grows into a suite of features (MTG Assistant, Card Trade Balancer, Card Lookup, Rules Lookup, and more), users need a single uncluttered way to move between them without each feature inventing its own entry chrome.

Outcome: a first-class **feature portal** — a compact top-right header menu (elevating the DEC-089 navigation pattern into its own package) backed by an extensible destination registry. Switching views is a frontend-only mode switch that preserves each feature's in-session state while the app stays loaded. New features register as destinations rather than shipping their own navigation. First-class destinations for the lookup suite include **card-lookup-qa** and **rules-lookup** (alongside MTG Assistant and Card Trade Balancer). Portal chrome should land before or with the first lookup UI so those features do not ship bespoke entry points.

Non-goals: no per-feature entry points or competing chrome; no backend routing or server-side navigation state; no persistence across page reload; no redesign of MTG Assistant, Trade Balancer, or lookup-feature internals (those features only register as destinations). Card Trade Balancer's planned slice B (nav menu ownership) should move here so the portal owns app chrome and the balancer depends on it.
