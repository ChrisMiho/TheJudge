import { PortalSlot } from "./portal/PortalSlot";

type StagedStepHeaderProps = {
  stepName: string;
  onBrandClick?: () => void;
};

export function StagedStepHeader({ stepName, onBrandClick }: StagedStepHeaderProps): JSX.Element {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-1">
      <div>
        {onBrandClick ? (
          <button
            type="button"
            onClick={onBrandClick}
            className="staged-step-brand motion-hover motion-press motion-focus bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text text-3xl font-bold tracking-tight text-transparent"
          >
            TheJudge
          </button>
        ) : (
          <h1 className="staged-step-brand bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            TheJudge
          </h1>
        )}
        <p className="text-sm text-zinc-300">MTG Assistant</p>
      </div>
      <PortalSlot />
      {/* min-w-0 lets this column shrink and wrap across its two words instead of
          overflowing — the brand block deliberately keeps its default min-content
          floor since "TheJudge" is a single word that can't wrap. */}
      <h2 className="staged-step-name min-w-0 justify-self-end text-right text-lg font-semibold text-accent-soft sm:text-xl">
        {stepName}
      </h2>
    </header>
  );
}
