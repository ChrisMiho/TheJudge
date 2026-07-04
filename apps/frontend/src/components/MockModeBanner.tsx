import { isMockProvider } from "../lib/env";

const MOCK_MODE_COPY = "⚖️ MOCK MODE · the real Judge is off duty — these rulings are pretend";

/**
 * Persistent, non-dismissible banner shown at the top of every screen when the
 * app is built/run with the mock AI provider (`ASK_AI_PROVIDER=mock`). Renders
 * nothing in live builds. Presentation only — no state, no controls, no motion.
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
