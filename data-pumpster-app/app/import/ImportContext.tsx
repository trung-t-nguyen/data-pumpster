'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type ParsedFile = {
  file: File;
  headers: string[];
  rowCount: number;
};

/** dbColumn → selected CSV header (empty string = unmapped) */
export type ColumnMapping = Record<string, string>;

type ImportContextValue = {
  parsed: ParsedFile | null;
  setParsed: (result: ParsedFile) => void;
  mapping: ColumnMapping;
  setMapping: (mapping: ColumnMapping) => void;
};

const ImportContext = createContext<ImportContextValue | null>(null);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});

  return (
    <ImportContext.Provider value={{ parsed, setParsed, mapping, setMapping }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImport(): ImportContextValue {
  const ctx = useContext(ImportContext);
  if (!ctx) throw new Error('useImport must be used inside <ImportProvider>');
  return ctx;
}
