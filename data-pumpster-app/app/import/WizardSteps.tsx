import { Fragment } from 'react';

const STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'Map Columns' },
  { num: 3, label: 'Import' },
];

export default function WizardSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center border-b border-border pb-8">
      {STEPS.map((step, idx) => (
        <Fragment key={step.num}>
          <div className="flex flex-1 items-center gap-3">
            <div
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                currentStep > step.num
                  ? 'border-green-500 bg-green-500 text-white'
                  : currentStep === step.num
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground',
              ].join(' ')}
            >
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span
              className={[
                'text-sm font-medium',
                currentStep === step.num ? 'text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && <div className="h-0.5 flex-1 bg-border" />}
        </Fragment>
      ))}
    </div>
  );
}
