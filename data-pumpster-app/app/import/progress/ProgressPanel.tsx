'use client';

export default function ProgressPanel({ jobId }: { jobId: string | null }) {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Job ID
        </p>
        <p
          data-testid="job-id"
          className="mt-1 font-mono text-sm text-foreground break-all"
        >
          {jobId}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            data-testid="job-status"
            className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          >
            Pending
          </span>
          <p className="text-sm text-muted-foreground">
            Your import job has been queued. Real-time progress monitoring will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}
