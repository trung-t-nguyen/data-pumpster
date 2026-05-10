import { z } from 'zod';

export type SchemaColumn = {
  dbColumn: string;
  label: string;
  required: boolean;
};

export const SCHEMA_COLUMNS: SchemaColumn[] = [
  { dbColumn: 'sku', label: 'SKU', required: true },
  { dbColumn: 'name', label: 'Name', required: true },
  { dbColumn: 'price', label: 'Price', required: true },
  { dbColumn: 'description', label: 'Description', required: false },
  { dbColumn: 'currency', label: 'Currency', required: false },
  { dbColumn: 'category_id', label: 'Category ID', required: false },
  { dbColumn: 'brand', label: 'Brand', required: false },
  { dbColumn: 'weight_kg', label: 'Weight (kg)', required: false },
  { dbColumn: 'is_active', label: 'Active?', required: false },
];

// Only validates the three required fields; extra keys are ignored.
export const mappingSchema = z.object({
  sku: z.string().min(1, 'SKU is required to proceed.'),
  name: z.string().min(1, 'Name is required to proceed.'),
  price: z.string().min(1, 'Price is required to proceed.'),
});

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}

/** Pre-fills dropdowns by exact normalized name match. Each CSV header used at most once. */
export function buildAutoMapping(headers: string[]): Record<string, string> {
  const used = new Set<string>();
  const result: Record<string, string> = {};

  for (const col of SCHEMA_COLUMNS) {
    const colNorm = normalize(col.dbColumn);
    const labelNorm = normalize(col.label);
    const match = headers.find((h) => {
      const hn = normalize(h);
      return (hn === colNorm || hn === labelNorm) && !used.has(h);
    });
    result[col.dbColumn] = match ?? '';
    if (match) used.add(match);
  }

  return result;
}

/** Returns the set of CSV headers that are selected more than once across the mapping. */
export function findDuplicateMappings(mapping: Record<string, string>): Set<string> {
  const counts = new Map<string, number>();
  for (const v of Object.values(mapping)) {
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [header, count] of counts) {
    if (count > 1) dupes.add(header);
  }
  return dupes;
}
