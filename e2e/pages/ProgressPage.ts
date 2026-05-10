import { type Locator, type Page } from '@playwright/test';
import path from 'path';

export class ProgressPage {
  readonly jobId: Locator;
  readonly jobStatus: Locator;
  readonly progressBar: Locator;
  readonly insertedRows: Locator;
  readonly skippedRows: Locator;
  readonly successBanner: Locator;
  readonly errorBanner: Locator;
  readonly newImportButton: Locator;
  readonly viewHistoryButton: Locator;

  constructor(readonly page: Page) {
    this.jobId = page.getByTestId('job-id');
    this.jobStatus = page.getByTestId('job-status');
    this.progressBar = page.getByTestId('progress-bar');
    this.insertedRows = page.getByTestId('inserted-rows');
    this.skippedRows = page.getByTestId('skipped-rows');
    this.successBanner = page.getByTestId('success-banner');
    this.errorBanner = page.getByTestId('error-banner');
    this.newImportButton = page.getByTestId('new-import-button');
    this.viewHistoryButton = page.getByTestId('view-history-button');
  }
}

/** Navigates through upload → mapping → submit and lands on /import/progress. */
export async function navigateToProgressViaFullFlow(page: Page): Promise<string> {
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(
    path.join(__dirname, '../fixtures/valid.csv'),
  );
  await page.getByText(/detected columns/i).waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: /continue to column mapping/i }).click();
  await page.waitForURL('**/import/map');

  await page.getByRole('combobox', { name: 'Map Name' }).selectOption('product_name');
  await page.getByRole('combobox', { name: 'Map Price' }).selectOption('unit_price');

  await page.getByRole('button', { name: 'Start Import' }).click();
  await page.waitForURL('**/import/progress**', { timeout: 30_000 });

  const url = new URL(page.url());
  return url.searchParams.get('jobId') ?? '';
}
