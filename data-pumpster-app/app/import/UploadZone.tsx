'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImport } from './ImportContext';
import type { WorkerResult } from './csv.worker';

const LARGE_FILE_BYTES = 500 * 1024 * 1024;

type ParsedResult = { headers: string[]; rowCount: number; file: File };

type State =
  | { phase: 'idle' }
  | { phase: 'processing'; largeFile: boolean }
  | { phase: 'done'; result: ParsedResult; largeFile: boolean }
  | { phase: 'error'; message: string };

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'Only CSV files are accepted. Please select a .csv file.';
  }
  return null;
}

export default function UploadZone() {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { setParsed } = useImport();
  const router = useRouter();

  const processFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setState({ phase: 'error', message: error });
      return;
    }

    const largeFile = file.size > LARGE_FILE_BYTES;
    setState({ phase: 'processing', largeFile });

    workerRef.current?.terminate();
    const worker = new Worker(new URL('./csv.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      const data = event.data;
      if ('error' in data) {
        if (data.error === 'empty') {
          setState({ phase: 'error', message: 'This file appears to be empty or has no column headers.' });
        } else {
          setState({ phase: 'error', message: data.error });
        }
      } else {
        setState({ phase: 'done', result: { ...data, file }, largeFile });
      }
      worker.terminate();
    };

    worker.onerror = (e) => {
      setState({ phase: 'error', message: e.message ?? 'Failed to parse CSV.' });
      worker.terminate();
    };

    worker.postMessage(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile],
  );

  const reset = () => {
    workerRef.current?.terminate();
    setState({ phase: 'idle' });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload zone — hidden while processing or done */}
      {(state.phase === 'idle' || state.phase === 'error') && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload CSV file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={[
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-14 cursor-pointer transition-colors select-none',
            dragging
              ? 'border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800'
              : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800',
          ].join(' ')}
        >
          <UploadIcon />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Drop a CSV file here, or{' '}
              <span className="text-zinc-900 underline underline-offset-2 dark:text-white">browse</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Only .csv files are accepted</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Error message */}
      {state.phase === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </div>
      )}

      {/* Processing indicator */}
      {state.phase === 'processing' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white px-8 py-14 dark:border-zinc-800 dark:bg-zinc-900">
          <Spinner />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Analysing file…</p>
          {state.largeFile && (
            <p className="max-w-xs text-center text-xs text-amber-600 dark:text-amber-400">
              Large file detected. Import may take several minutes.
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {state.phase === 'done' && (
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {state.largeFile && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Large file detected. Import may take several minutes.
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">File</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {state.result.file.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Rows</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {state.result.rowCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Detected columns ({state.result.headers.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {state.result.headers.map((h) => (
                <span
                  key={h}
                  className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Choose different file
            </button>
            <button
              type="button"
              onClick={() => {
                setParsed(state.result);
                router.push('/import/map');
              }}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Continue to Column Mapping →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-400"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin text-zinc-400"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
