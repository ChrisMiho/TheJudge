import { BrandMark } from "./BrandMark";
import { PortalSlot } from "./portal/PortalSlot";

type StagedStepHeaderProps = {
  onBrandClick?: () => void;
};

export function StagedStepHeader({ onBrandClick }: StagedStepHeaderProps): JSX.Element {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
      <PortalSlot />
      <div className="text-center">
        <BrandMark onClick={onBrandClick} />
        <p className="text-sm text-zinc-300">MTG Assistant</p>
      </div>
      <div aria-hidden="true" />
    </header>
  );
}
