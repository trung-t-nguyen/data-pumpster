'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImport } from '../ImportContext';
import {
  SCHEMA_COLUMNS,
  buildAutoMapping,
  findDuplicateMappings,
  mappingSchema,
} from './schema';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function MappingPanel() {
  const { parsed, setMapping: saveMapping } = useImport();
  const router = useRouter();

  useEffect(() => {
    if (!parsed) router.replace('/import');
  }, [parsed, router]);

  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    parsed ? buildAutoMapping(parsed.headers) : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duplicates = useMemo(() => findDuplicateMappings(mapping), [mapping]);

  if (!parsed) return null;

  const { headers, file, rowCount } = parsed;

  function handleChange(dbColumn: string, value: string) {
    setMapping((prev) => ({ ...prev, [dbColumn]: value }));
    if (errors[dbColumn]) setErrors((prev) => ({ ...prev, [dbColumn]: '' }));
  }

  async function handleSubmit() {
    const result = mappingSchema.safeParse(mapping);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('totalRows', String(rowCount));

      const res = await fetch(`${API_URL}/api/v1/import/jobs`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail ?? `Server error (${res.status})`;
        setSubmitError(detail);
        return;
      }

      const { jobId } = await res.json();
      saveMapping(mapping);
      router.push(`/import/progress?jobId=${jobId}`);
    } catch {
      setSubmitError('Upload failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* File summary */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="font-medium text-foreground">{file.name}</span>
        <span className="text-muted-foreground">{rowCount.toLocaleString()} rows</span>
      </div>

      {/* Mapping rows */}
      <div className="flex flex-col gap-3">
        {SCHEMA_COLUMNS.map((col) => {
          const selected = mapping[col.dbColumn] ?? '';
          const isDupe = !!selected && duplicates.has(selected);
          const hasError = !!errors[col.dbColumn];

          return (
            <div
              key={col.dbColumn}
              className="grid grid-cols-[1fr_1.5rem_1fr] items-center gap-4 rounded-lg border border-border bg-muted/50 p-4"
            >
              {/* Left: schema field label */}
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span>{col.label}</span>
                {col.required && (
                  <span
                    data-testid="required-badge"
                    className="rounded-full border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    Required
                  </span>
                )}
              </div>

              {/* Arrow */}
              <div className="text-center text-muted-foreground">→</div>

              {/* Right: CSV header dropdown */}
              <div className="flex flex-col gap-1">
                <select
                  aria-label={`Map ${col.label}`}
                  value={selected}
                  onChange={(e) => handleChange(col.dbColumn, e.target.value)}
                  className={[
                    'h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring/50',
                    hasError
                      ? 'border-destructive text-destructive focus:ring-destructive/30'
                      : isDupe
                        ? 'border-amber-400 focus:ring-amber-200'
                        : 'border-input focus:border-ring',
                  ].join(' ')}
                >
                  <option value="">— Not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>

                {hasError && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors[col.dbColumn]}
                  </p>
                )}
                {isDupe && !hasError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    This CSV column is already mapped elsewhere.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit error banner */}
      {submitError && (
        <div
          role="alert"
          data-testid="submit-error"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/import')}
          disabled={isSubmitting}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          data-testid="start-import"
          className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Start Import'}
        </button>
      </div>
    </div>
  );
}
