type StagedStepHeaderProps = {
  stepName: string;
  onBrandClick?: () => void;
};

export function StagedStepHeader({ stepName, onBrandClick }: StagedStepHeaderProps): JSX.Element {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
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
      <h2 className="staged-step-name ml-auto text-right text-lg font-semibold text-accent-soft sm:text-xl">{stepName}</h2>
    </header>
  );
}
