import { type Locator, type Page } from '@playwright/test';
import path from 'path';

/** The 9 schema columns displayed in the mapping table. */
export const SCHEMA_COLUMNS = [
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

export class MapPage {
  readonly startImportButton: Locator;
  readonly backButton: Locator;

  constructor(readonly page: Page) {
    this.startImportButton = page.getByRole('button', { name: 'Start Import' });
    this.backButton = page.getByRole('button', { name: /← Back/i });
  }

  async goto() {
    await this.page.goto('/import/map');
  }

  /** Selects a CSV header in the native <select> for a given DB column label. */
  async selectMapping(colLabel: string, csvHeader: string) {
    const select = this.page.getByRole('combobox', { name: `Map ${colLabel}` });
    await select.selectOption(csvHeader === '— None —' ? '' : csvHeader);
  }

  /** Returns the native <select> locator for a given DB column label. */
  triggerFor(colLabel: string): Locator {
    return this.page.getByRole('combobox', { name: `Map ${colLabel}` });
  }

  /** Returns the error message locator for a given DB column label. */
  errorFor(colLabel: string): Locator {
    return this.page.getByRole('alert').filter({ hasText: `${colLabel} is required to proceed.` });
  }
}

/** Uploads a valid CSV through the upload step so context is populated for /import/map. */
export async function navigateToMapViaUpload(page: Page) {
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(
    path.join(__dirname, '../fixtures/valid.csv'),
  );
  await page.getByText(/detected columns/i).waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: /continue to column mapping/i }).click();
  await page.waitForURL('**/import/map');
}
