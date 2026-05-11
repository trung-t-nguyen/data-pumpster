'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ImportJobSummary {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number | null;
  insertedRows: number;
  skippedRows: number;
  errorDescription: string | null;
  startedAt: string;
  completedAt: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
};

export default function HistoryTab() {
  const [jobs, setJobs] = useState<ImportJobSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/v1/import/jobs')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch import history: ${res.status}`);
        return res.json() as Promise<ImportJobSummary[]>;
      })
      .then(setJobs)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" data-testid="history-error">
        {error}
      </p>
    );
  }

  if (jobs === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="history-loading">
        Loading…
      </p>
    );
  }

  if (jobs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center"
        data-testid="history-empty-state"
      >
        <p className="text-sm text-muted-foreground">
          No imports yet. Start your first import to load product data.
        </p>
        <Link
          href="/import?tab=new"
          className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          data-testid="history-start-import-cta"
        >
          Start your first import
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="history-table-container">
      <table className="w-full text-sm" data-testid="history-table">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Total Rows</th>
            <th className="pb-3 pr-4">Inserted</th>
            <th className="pb-3 pr-4">Skipped</th>
            <th className="pb-3 pr-4">Started</th>
            <th className="pb-3">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((job) => (
            <tr
              key={job.id}
              data-testid={`job-row-${job.id}`}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <td className="py-3 pr-4">
                {job.status === 'processing' ? (
                  <Link
                    href={`/import/progress?jobId=${job.id}`}
                    className="inline-block"
                    data-testid={`job-link-${job.id}`}
                  >
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize underline-offset-2 hover:underline ${STATUS_STYLES[job.status]}`}
                      data-testid={`job-status-${job.id}`}
                    >
                      {job.status}
                    </span>
                  </Link>
                ) : (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[job.status] ?? ''}`}
                    data-testid={`job-status-${job.id}`}
                  >
                    {job.status}
                  </span>
                )}
                {job.status === 'failed' && job.errorDescription && (
                  <p
                    className="mt-1 max-w-xs truncate text-xs text-red-600 dark:text-red-400"
                    title={job.errorDescription}
                    data-testid={`job-error-${job.id}`}
                  >
                    {job.errorDescription}
                  </p>
                )}
              </td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                {job.totalRows ?? '—'}
              </td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                {job.insertedRows}
              </td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                {job.skippedRows}
              </td>
              <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                {formatDate(job.startedAt)}
              </td>
              <td className="py-3 tabular-nums text-zinc-500 dark:text-zinc-400">
                {formatDuration(job.startedAt, job.completedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
