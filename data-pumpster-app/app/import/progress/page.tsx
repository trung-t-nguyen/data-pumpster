import type { Metadata } from 'next';
import WizardSteps from '../WizardSteps';
import ProgressPanel from './ProgressPanel';

export const metadata: Metadata = {
  title: 'Import Progress — Data Pumpster',
  description: 'Track the progress of your CSV import job.',
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <WizardSteps currentStep={3} />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Import Progress
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your import job has been submitted and is processing in the background.
        </p>
      </div>
      <ProgressPanel jobId={jobId ?? null} />
    </main>
  );
}
