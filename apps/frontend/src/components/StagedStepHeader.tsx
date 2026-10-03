import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "./BrandMark";
import { MockModeBanner } from "./MockModeBanner";
import type { ConversationHistoryTriggerDescriptor } from "./ConversationWorkspace";
import { PageShellHeaderSlotContext } from "./pageShellContext";
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
 * REQ-207: the banner header (`shell.css`'s `.app-header`, a `1fr auto 1fr`
 * grid: the ☰ slot, the centred brand, an optional right slot) and the
 * mock-mode strip under it (REQ-123). Inside a `PageShell` both render into the
 * shell's header slot, at the top edge of the page and outside the column's
 * padding, in the mockup's DOM order; with no shell above they render inline.
 */
export function StagedStepHeader({ onBrandClick, historyTrigger, rightSlot }: StagedStepHeaderProps): JSX.Element | null {
  const slot = useContext(PageShellHeaderSlotContext);

  const header = (
    <>
      <header className="app-header">
        <PortalSlot historyTrigger={historyTrigger} />
        <BrandMark onClick={onBrandClick} />
        {rightSlot ? (
          <div className="hidden justify-self-end md:block">{rightSlot}</div>
        ) : (
          <div aria-hidden="true" />
        )}
      </header>
      <MockModeBanner />
    </>
  );

  if (slot === undefined) {
    return header;
  }
  return slot ? createPortal(header, slot) : null;
}
