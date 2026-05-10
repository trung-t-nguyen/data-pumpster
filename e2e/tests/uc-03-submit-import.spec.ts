import path from 'path';
import { expect, test } from './base';

/**
 * These tests require the Spring Boot backend to be running on http://localhost:8080.
 * Start it with: cd data-pumpster-server && ./gradlew bootRun
 *
 * Error-flow tests use Playwright route interception and do NOT need the backend.
 */

test.describe('UC-03 — Submit an Import Job', () => {
  // -------------------------------------------------------------------------
  // Main success scenario (requires live backend)
  // -------------------------------------------------------------------------

  test('main flow: Start Import submits the job and navigates to progress page', async ({
    progressPage,
  }) => {
    await expect(progressPage.page).toHaveURL(/\/import\/progress/);
    await expect(progressPage.page).toHaveURL(/jobId=/);
  });

  test('main flow: progress page shows the returned job ID', async ({ progressPage }) => {
    const url = new URL(progressPage.page.url());
    const jobId = url.searchParams.get('jobId');
    expect(jobId).toBeTruthy();

    await expect(progressPage.jobId).toBeVisible();
    await expect(progressPage.jobId).toContainText(jobId!);
  });

  test('main flow: progress page shows pending status badge', async ({ progressPage }) => {
    await expect(progressPage.jobStatus).toBeVisible();
    await expect(progressPage.jobStatus).toContainText(/pending/i);
  });

  // -------------------------------------------------------------------------
  // BR-01 — loading state while submitting
  // -------------------------------------------------------------------------

  test('BR-01: Start Import button shows loading state during submission', async ({ page }) => {
    // Use a slow route to observe the loading state
    await page.goto('/import');
    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, '../fixtures/valid.csv'),
    );
    await page.getByText(/detected columns/i).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('button', { name: /continue to column mapping/i }).click();
    await page.waitForURL('**/import/map');

    await page.getByRole('combobox', { name: 'Map Name' }).selectOption('product_name');
    await page.getByRole('combobox', { name: 'Map Price' }).selectOption('unit_price');

    // Delay the response so we can observe the loading state
    await page.route('**/api/v1/import/jobs', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });

    await page.getByRole('button', { name: 'Start Import' }).click();

    // Button should immediately show loading label
    await expect(page.getByTestId('start-import')).toContainText('Submitting');
    await expect(page.getByTestId('start-import')).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Alt flow A — network error
  // -------------------------------------------------------------------------

  test('alt flow A: network error shows upload-failed message', async ({ page }) => {
    await page.goto('/import');
    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, '../fixtures/valid.csv'),
    );
    await page.getByText(/detected columns/i).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('button', { name: /continue to column mapping/i }).click();
    await page.waitForURL('**/import/map');

    await page.getByRole('combobox', { name: 'Map Name' }).selectOption('product_name');
    await page.getByRole('combobox', { name: 'Map Price' }).selectOption('unit_price');

    await page.route('**/api/v1/import/jobs', (route) => route.abort('failed'));

    await page.getByRole('button', { name: 'Start Import' }).click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
    await expect(page.getByTestId('submit-error')).toContainText(
      /upload failed.*check your connection/i,
    );

    // Still on the mapping page
    await expect(page).toHaveURL(/\/import\/map/);
  });

  test('alt flow A: operator can retry after a network error', async ({ page }) => {
    await page.goto('/import');
    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, '../fixtures/valid.csv'),
    );
    await page.getByText(/detected columns/i).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('button', { name: /continue to column mapping/i }).click();
    await page.waitForURL('**/import/map');

    await page.getByRole('combobox', { name: 'Map Name' }).selectOption('product_name');
    await page.getByRole('combobox', { name: 'Map Price' }).selectOption('unit_price');

    // First attempt: fail
    await page.route('**/api/v1/import/jobs', (route) => route.abort('failed'));
    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByTestId('submit-error')).toBeVisible();

    // Second attempt: succeed
    await page.unroute('**/api/v1/import/jobs');
    await page.route('**/api/v1/import/jobs', (route) =>
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: '00000000-0000-0000-0000-000000000001' }),
      }),
    );

    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page).toHaveURL(/\/import\/progress/);
  });

  // -------------------------------------------------------------------------
  // Alt flow B — backend rejects payload
  // -------------------------------------------------------------------------

  test('alt flow B: 400 from backend shows server error message', async ({ page }) => {
    await page.goto('/import');
    await page.locator('input[type="file"]').setInputFiles(
      path.join(__dirname, '../fixtures/valid.csv'),
    );
    await page.getByText(/detected columns/i).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('button', { name: /continue to column mapping/i }).click();
    await page.waitForURL('**/import/map');

    await page.getByRole('combobox', { name: 'Map Name' }).selectOption('product_name');
    await page.getByRole('combobox', { name: 'Map Price' }).selectOption('unit_price');

    await page.route('**/api/v1/import/jobs', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: "Required mapping field 'sku' is missing or empty.",
        }),
      }),
    );

    await page.getByRole('button', { name: 'Start Import' }).click();

    await expect(page.getByTestId('submit-error')).toBeVisible();
    await expect(page.getByTestId('submit-error')).toContainText(/sku.*missing/i);

    // Still on the mapping page
    await expect(page).toHaveURL(/\/import\/map/);
  });

  // -------------------------------------------------------------------------
  // BR-02 — job ID traceability
  // -------------------------------------------------------------------------

  test('BR-02: job ID on progress page is a valid UUID', async ({ progressPage }) => {
    const url = new URL(progressPage.page.url());
    const jobId = url.searchParams.get('jobId') ?? '';
    expect(jobId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  // -------------------------------------------------------------------------
  // Direct navigation to /import/progress without a jobId
  // -------------------------------------------------------------------------

  test('direct navigation without jobId shows error message', async ({ page }) => {
    await page.goto('/import/progress');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/no job id/i);
  });
});
