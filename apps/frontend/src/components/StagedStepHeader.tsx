import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { MockModeBanner } from "./MockModeBanner";
import type { ConversationHistoryTriggerDescriptor } from "./ConversationWorkspace";
import { PortalSlot } from "./portal/PortalSlot";

type StagedStepHeaderProps = {
  onBrandClick?: () => void;
  historyTrigger?: ConversationHistoryTriggerDescriptor;
  /** REQ-215: an optional right-hand slot at `768px`+ — Trade Balancer's price
   * date, hidden below `768px` (where it moves under the title instead) so the
   * slot never doubles the content up. Every other caller leaves this unset and
   * keeps the empty balancing column the three-column grid had before. */
  rightSlot?: ReactNode;
};

/**
 * Look-matching pass (slice L): this grid (`1fr auto 1fr`, the PortalSlot's ☰
 * left column, the centred brand, the optional `rightSlot`) is now styled as
 * `.app-header` (`shell.css:63-81`) — a sticky, full-bleed banner, in place of
 * a plain in-flow row. `MockModeBanner` moves here, directly under the
 * header, from `PageShell` (which still renders it for the full-bleed Life
 * Tracker variant, the one destination with no `StagedStepHeader`) — the
 * mockup's strip is the header's own sibling, not a page-level fixed overlay
 * (see `MockModeBanner.tsx`'s own comment). The former separate "MTG
 * Assistant" tagline line retires: `BrandMark` now carries its own tagline
 * (requirement #4), so repeating it here would show it twice.
 */
export function StagedStepHeader({ onBrandClick, historyTrigger, rightSlot }: StagedStepHeaderProps): JSX.Element {
  return (
    <>
      <header className="app-header">
        <PortalSlot historyTrigger={historyTrigger} />
        <div className="text-center">
          <BrandMark onClick={onBrandClick} />
        </div>
        {rightSlot ? (
          <div className="hidden justify-self-end md:block">{rightSlot}</div>
        ) : (
          <div aria-hidden="true" />
        )}
      </header>
      <MockModeBanner />
    </>
  );
}
