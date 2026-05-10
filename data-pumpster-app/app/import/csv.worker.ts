import Papa from 'papaparse';

export type WorkerResult =
  | { headers: string[]; rowCount: number }
  | { error: 'empty' | string };

onmessage = (event: MessageEvent<File>) => {
  const file = event.data;

  // Phase 1: extract headers quickly with preview:1
  Papa.parse<Record<string, string>>(file, {
    header: true,
    preview: 1,
    complete: (preview) => {
      const headers = preview.meta.fields ?? [];
      if (headers.length === 0) {
        postMessage({ error: 'empty' } satisfies WorkerResult);
        return;
      }

      // Phase 2: stream entire file to count data rows
      let rowCount = 0;
      Papa.parse<Record<string, string>>(file, {
        header: true,
        step: () => {
          rowCount++;
        },
        complete: () => {
          postMessage({ headers, rowCount } satisfies WorkerResult);
        },
        error: (err) => {
          postMessage({ error: err.message } satisfies WorkerResult);
        },
      });
    },
    error: (err) => {
      postMessage({ error: err.message } satisfies WorkerResult);
    },
  });
};
