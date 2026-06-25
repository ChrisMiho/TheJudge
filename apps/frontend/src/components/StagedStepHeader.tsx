type StagedStepHeaderProps = {
  stepName: string;
};

export function StagedStepHeader({ stepName }: StagedStepHeaderProps): JSX.Element {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div>
        <h1 className="bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          TheJudge
        </h1>
        <p className="text-sm text-zinc-300">Stack Assistant</p>
      </div>
      <h2 className="ml-auto text-right text-lg font-semibold text-accent-soft sm:text-xl">{stepName}</h2>
    </header>
  );
}
