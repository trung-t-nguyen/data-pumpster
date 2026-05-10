'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProgressEvent {
  eventId: number;
  status: 'processing' | 'completed' | 'failed';
  insertedRows: number;
  skippedRows: number;
  totalRows: number | null;
  errorDescription: string | null;
}

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface State {
  status: JobStatus;
  insertedRows: number;
  skippedRows: number;
  totalRows: number | null;
  errorDescription: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function ProgressPanel({ jobId }: { jobId: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<State>({
    status: 'pending',
    insertedRows: 0,
    skippedRows: 0,
    totalRows: null,
    errorDescription: null,
  });

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`${API_URL}/api/v1/import/jobs/${jobId}/events`);

    es.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as ProgressEvent;
      setState({
        status: data.status,
        insertedRows: data.insertedRows,
        skippedRows: data.skippedRows,
        totalRows: data.totalRows,
        errorDescription: data.errorDescription,
      });
      if (data.status === 'completed' || data.status === 'failed') {
        es.close();
      }
    };

    return () => {
      es.close();
    };
  }, [jobId]);

  if (!jobId) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        No job ID found. Please go back and start the import again.
      </div>
    );
  }

  const isTerminal = state.status === 'completed' || state.status === 'failed';

  const progressPercent =
    state.status === 'completed'
      ? 100
      : state.totalRows && state.totalRows > 0
        ? Math.min(100, Math.round(((state.insertedRows + state.skippedRows) / state.totalRows) * 100))
        : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Job ID */}
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Job ID</p>
        <p
          data-testid="job-id"
          className="mt-1 font-mono text-sm text-foreground break-all"
        >
          {jobId}
        </p>
      </div>

      {/* Status + progress bar + row counters */}
      <div className="rounded-lg border border-border bg-muted/50 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {state.status === 'processing' && (
            <Loader2 className="size-4 animate-spin text-amber-500 shrink-0" />
          )}
          {state.status === 'completed' && (
            <CheckCircle className="size-4 text-green-500 shrink-0" />
          )}
          {state.status === 'failed' && (
            <XCircle className="size-4 text-destructive shrink-0" />
          )}
          <span
            data-testid="job-status"
            className={
              state.status === 'completed'
                ? 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : state.status === 'failed'
                  ? 'rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : state.status === 'processing'
                    ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }
          >
            {state.status === 'pending' && 'Pending'}
            {state.status === 'processing' && 'Processing…'}
            {state.status === 'completed' && 'Completed'}
            {state.status === 'failed' && 'Failed'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          {progressPercent !== null ? (
            <div
              data-testid="progress-bar"
              className={`h-full rounded-full transition-all duration-500 ${
                state.status === 'completed' ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          ) : (
            <div
              data-testid="progress-bar"
              className="h-full w-1/3 rounded-full bg-primary animate-pulse"
              role="progressbar"
              aria-label="Import in progress"
            />
          )}
        </div>

        {/* Row counters — shown once we have data */}
        {(state.status === 'processing' || isTerminal) && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <span data-testid="inserted-rows" className="font-medium text-foreground">
                {state.insertedRows.toLocaleString()}
              </span>{' '}
              inserted
            </span>
            <span>
              <span data-testid="skipped-rows" className="font-medium text-foreground">
                {state.skippedRows.toLocaleString()}
              </span>{' '}
              skipped
            </span>
            {state.totalRows !== null && (
              <span>
                <span className="font-medium text-foreground">
                  {state.totalRows.toLocaleString()}
                </span>{' '}
                total
              </span>
            )}
          </div>
        )}
      </div>

      {/* Success banner */}
      {state.status === 'completed' && (
        <div
          data-testid="success-banner"
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/30 dark:bg-green-900/20"
        >
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Import completed successfully
            </p>
            <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
              {state.insertedRows.toLocaleString()} row{state.insertedRows !== 1 ? 's' : ''} inserted
              {state.skippedRows > 0 &&
                `, ${state.skippedRows.toLocaleString()} skipped (duplicate SKUs)`}
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {state.status === 'failed' && (
        <div
          data-testid="error-banner"
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
        >
          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Import failed</p>
            {state.errorDescription && (
              <p className="mt-0.5 text-xs text-destructive/80">{state.errorDescription}</p>
            )}
          </div>
        </div>
      )}

      {/* Post-terminal navigation buttons */}
      {isTerminal && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            data-testid="new-import-button"
            onClick={() => router.push('/import')}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Start a new import
          </button>
          <button
            data-testid="view-history-button"
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View import history
          </button>
        </div>
      )}
    </div>
  );
}
