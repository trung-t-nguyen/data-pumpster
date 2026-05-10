import type { Metadata } from 'next';
import MappingPanel from './MappingPanel';

export const metadata: Metadata = {
  title: 'Map Columns — Data Pumpster',
  description: 'Map your CSV columns to the product schema.',
};

export default function MapPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Map Columns
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Match each database field to the corresponding column in your CSV file.
        </p>
      </div>
      <MappingPanel />
    </main>
  );
}
