import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
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

export function StagedStepHeader({ onBrandClick, historyTrigger, rightSlot }: StagedStepHeaderProps): JSX.Element {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
      <PortalSlot historyTrigger={historyTrigger} />
      <div className="text-center">
        <BrandMark onClick={onBrandClick} />
        <p className="text-sm text-zinc-300">MTG Assistant</p>
      </div>
      {rightSlot ? (
        <div className="hidden justify-self-end md:block">{rightSlot}</div>
      ) : (
        <div aria-hidden="true" />
      )}
    </header>
  );
}
