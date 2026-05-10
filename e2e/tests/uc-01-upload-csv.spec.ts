import { expect, test } from './base';

test.describe('UC-01 — Upload a Product CSV File', () => {
  // -------------------------------------------------------------------------
  // Page load
  // -------------------------------------------------------------------------

  test('shows upload zone on page load', async ({ importPage }) => {
    await expect(importPage.uploadZone).toBeVisible();
    await expect(importPage.page.getByText('Drop a CSV file here')).toBeVisible();
    await expect(importPage.page.getByText('Only .csv files are accepted')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Main success scenario
  // -------------------------------------------------------------------------

  test('main flow: valid CSV shows processing indicator then headers and row count', async ({ importPage }) => {
    await importPage.uploadFixture('valid.csv');

    await expect(importPage.spinner).toBeVisible();
    await importPage.waitForResults();

    for (const header of ['sku', 'product_name', 'unit_price', 'category', 'brand_name']) {
      await expect(importPage.page.getByText(header, { exact: true })).toBeVisible();
    }
    await expect(importPage.rowsLabel).toBeVisible();
    await expect(importPage.page.getByText('9', { exact: true })).toBeVisible();
    await expect(importPage.continueButton).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Alt flow A — wrong file type
  // -------------------------------------------------------------------------

  test('alt flow A: non-CSV file is rejected with error message', async ({ importPage }) => {
    await importPage.uploadFixture('document.txt');

    await expect(
      importPage.page.getByText('Only CSV files are accepted. Please select a .csv file.'),
    ).toBeVisible();
    await expect(importPage.uploadZone).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Alt flow B — large file (> 500 MB)
  // -------------------------------------------------------------------------

  test('alt flow B: large file shows non-blocking warning, flow continues normally', async ({ importPage }) => {
    await importPage.dropLargeFile();

    await expect(importPage.largeFileWarning).toBeVisible({ timeout: 20_000 });
    await importPage.waitForResults();
    await expect(importPage.largeFileWarning).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Alt flow C — empty / no headers
  // -------------------------------------------------------------------------

  test('alt flow C: empty file shows error', async ({ importPage }) => {
    await importPage.uploadFixture('empty.csv');

    await expect(
      importPage.page.getByText('This file appears to be empty or has no column headers.'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(importPage.uploadZone).toBeVisible();
  });

  test('alt flow C: headers-only CSV shows results with 0 data rows', async ({ importPage }) => {
    await importPage.uploadFixture('headers-only.csv');

    await importPage.waitForResults(10_000);
    await expect(importPage.page.getByText('0', { exact: true })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  test('"choose different file" resets back to the upload zone', async ({ importPage }) => {
    await importPage.uploadFixture('valid.csv');
    await importPage.waitForResults();

    await importPage.resetButton.click();

    await expect(importPage.uploadZone).toBeVisible();
    await expect(importPage.resultsPanel).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Business rule BR-03 — no server traffic
  // -------------------------------------------------------------------------

  test('BR-03: no network requests are made during file selection and parsing', async ({ importPage, page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (!req.url().includes('/_next') && !req.url().endsWith('/import')) {
        requests.push(req.url());
      }
    });

    await importPage.uploadFixture('valid.csv');
    await importPage.waitForResults();

    expect(requests, `Unexpected server requests: ${requests.join(', ')}`).toHaveLength(0);
  });
});
