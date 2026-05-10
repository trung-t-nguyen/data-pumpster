import type { Metadata } from 'next';
import UploadZone from './UploadZone';
import WizardSteps from './WizardSteps';

export const metadata: Metadata = {
  title: 'Upload CSV — Data Pumpster',
  description: 'Upload a CSV file to begin the import process.',
};

export default function ImportPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <WizardSteps currentStep={1} />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Upload Product CSV
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Select a CSV file to begin the import process.
        </p>
      </div>
      <UploadZone />
    </main>
  );
}
