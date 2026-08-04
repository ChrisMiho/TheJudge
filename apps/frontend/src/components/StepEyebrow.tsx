export type StepEyebrowProps = {
  stepName: string;
};

export function StepEyebrow({ stepName }: StepEyebrowProps): JSX.Element {
  return (
    <h2 className="step-eyebrow bg-gradient-to-r from-accent-soft to-accent-strong bg-clip-text font-semibold uppercase tracking-[0.08em] text-transparent">
      {stepName}
    </h2>
  );
}
