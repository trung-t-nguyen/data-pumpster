import type { Metadata } from 'next';
import UploadZone from './UploadZone';

export const metadata: Metadata = {
  title: 'Import Products — Data Pumpster',
  description: 'Upload a CSV file to import product data.',
};

export default function ImportPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Import Products
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Upload a CSV file to begin importing your product catalogue.
        </p>
      </div>
      <UploadZone />
    </main>
  );
}
