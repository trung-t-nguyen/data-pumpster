import { test, expect } from '@playwright/test';
import path from 'path';

const fixtures = (name: string) => path.join(__dirname, 'fixtures', name);

test.describe('UC-01 — Upload a Product CSV File', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/import');
  });

  // ---------------------------------------------------------------------------
  // Page load
  // ---------------------------------------------------------------------------

  test('shows upload zone on page load', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Upload CSV file' })).toBeVisible();
    await expect(page.getByText('Drop a CSV file here')).toBeVisible();
    await expect(page.getByText('Only .csv files are accepted')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Main success scenario
  // ---------------------------------------------------------------------------

  test('main flow: valid CSV shows processing indicator then headers and row count', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixtures('valid.csv'));

    // Step 3 — processing indicator
    await expect(page.getByText('Analysing file…')).toBeVisible();

    // Step 4 — results panel
    await expect(page.getByText(/detected columns/i)).toBeVisible({ timeout: 15_000 });

    // Detected column headers
    for (const header of ['sku', 'product_name', 'unit_price', 'category', 'brand_name']) {
      await expect(page.getByText(header, { exact: true })).toBeVisible();
    }

    // Row count (valid.csv has 9 data rows)
    await expect(page.getByText('Rows', { exact: true })).toBeVisible();
    await expect(page.getByText('9', { exact: true })).toBeVisible();

    // Step 5 — advance button present
    await expect(page.getByRole('button', { name: /continue to column mapping/i })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Alt flow A — wrong file type
  // ---------------------------------------------------------------------------

  test('alt flow A: non-CSV file is rejected with error message', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixtures('document.txt'));

    await expect(
      page.getByText('Only CSV files are accepted. Please select a .csv file.'),
    ).toBeVisible();

    // Upload zone stays visible so operator can retry
    await expect(page.getByRole('button', { name: 'Upload CSV file' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Alt flow B — large file (> 500 MB)
  // ---------------------------------------------------------------------------

  test('alt flow B: large file shows non-blocking warning, flow continues normally', async ({ page }) => {
    // Simulate a large file via drag-and-drop with a spoofed size.
    // The file content is tiny so parsing completes instantly; only file.size
    // is overridden so the component's size check triggers the warning.
    await page.evaluate(() => {
      const file = new File(['sku,name,price\nABC-1,Widget,9.99'], 'huge.csv', {
        type: 'text/csv',
      });

      // Shadow the prototype getter with an own data property (Chromium allows this)
      Object.defineProperty(file, 'size', {
        value: 600 * 1024 * 1024,
        configurable: true,
      });

      const dt = new DataTransfer();
      dt.items.add(file);

      const zone = document.querySelector('[aria-label="Upload CSV file"]');
      zone?.dispatchEvent(
        new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }),
      );
    });

    // Non-blocking warning visible during processing
    await expect(page.getByText(/large file detected/i)).toBeVisible({ timeout: 10_000 });

    // Flow continues — results are shown
    await expect(page.getByText(/detected columns/i)).toBeVisible({ timeout: 15_000 });

    // Warning also shown in the results panel
    await expect(page.getByText(/large file detected/i).first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Alt flow C — empty file / no headers
  // ---------------------------------------------------------------------------

  test('alt flow C: empty file shows error', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixtures('empty.csv'));

    await expect(
      page.getByText('This file appears to be empty or has no column headers.'),
    ).toBeVisible({ timeout: 10_000 });

    // Upload zone returns so operator can retry
    await expect(page.getByRole('button', { name: 'Upload CSV file' })).toBeVisible();
  });

  test('alt flow C: headers-only CSV with no data rows is accepted (0 rows shown)', async ({ page }) => {
    // A file with only a header row is valid — PapaParse detects the headers.
    // The operator sees 0 data rows and can proceed to mapping.
    await page.locator('input[type="file"]').setInputFiles(fixtures('headers-only.csv'));

    await expect(page.getByText(/detected columns/i)).toBeVisible({ timeout: 10_000 });
    // 0 data rows — only the header line was in the file
    await expect(page.getByText('0', { exact: true })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  test('"choose different file" resets back to upload zone', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixtures('valid.csv'));
    await expect(page.getByText(/detected columns/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Choose different file' }).click();

    await expect(page.getByRole('button', { name: 'Upload CSV file' })).toBeVisible();
    await expect(page.getByText(/detected columns/i)).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Business rule BR-03 — no server traffic during upload
  // ---------------------------------------------------------------------------

  test('BR-03: no network requests are made during file selection and parsing', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (req) => {
      // Ignore the page load and Next.js asset requests
      if (!req.url().includes('localhost:3000/_next') && !req.url().endsWith('/import')) {
        requests.push(req.url());
      }
    });

    await page.locator('input[type="file"]').setInputFiles(fixtures('valid.csv'));
    await expect(page.getByText(/detected columns/i)).toBeVisible({ timeout: 15_000 });

    expect(requests, `Unexpected server requests: ${requests.join(', ')}`).toHaveLength(0);
  });
});
