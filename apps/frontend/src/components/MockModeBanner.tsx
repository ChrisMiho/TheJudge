import { isMockProvider } from "../lib/env";

const MOCK_MODE_COPY = "⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend";

/**
 * Persistent, non-dismissible banner shown directly under the header on every
 * screen when the app is built/run with the mock AI provider
 * (`ASK_AI_PROVIDER=mock`). Renders nothing in live builds. Presentation
 * only — no state, no controls, no motion.
 *
 * Look-matching pass (slice L): restyled per `shell.css:325-332` and moved
 * into normal flow (`StagedStepHeader` renders it right after `.app-header`;
 * `PageShell` still renders it for the one destination with no
 * `StagedStepHeader`, Life Tracker's full-bleed variant). Previously
 * `position: fixed` at the viewport top, which needed its own measured
 * height (REQ-123's `--mock-banner-height`, published here via a
 * `ResizeObserver`) so the shell could reserve matching clearance — a static
 * banner needs no clearance calculation and no measurement, so that
 * mechanism retires with the fixed positioning. Gating logic
 * (`isMockProvider`) is unchanged.
 */
export function MockModeBanner(): JSX.Element | null {
  if (!isMockProvider) {
    return null;
  }

  return (
    <div className="mock-mode-banner" role="status">
      {MOCK_MODE_COPY}
    </div>
  );
}
