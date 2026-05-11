import type { Metadata } from 'next';
import { Suspense } from 'react';
import UploadZone from './UploadZone';
import WizardSteps from './WizardSteps';
import TabBar from './TabBar';
import HistoryTab from './HistoryTab';

export const metadata: Metadata = {
  title: 'Import — Data Pumpster',
  description: 'Upload CSV files or review past import history.',
};

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === 'history' ? 'history' : 'new';

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Suspense>
        <TabBar />
      </Suspense>

      {activeTab === 'history' ? (
        <HistoryTab />
      ) : (
        <>
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
        </>
      )}
    </main>
  );
}
