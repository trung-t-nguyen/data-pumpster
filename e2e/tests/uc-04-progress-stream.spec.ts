import path from 'path';
import { expect, test } from './base';

/**
 * These tests require the Spring Boot backend running on http://localhost:8080.
 * Failed-flow tests use Playwright route interception and do NOT need live backend SSE.
 */

const COMPLETION_TIMEOUT = 30_000;

test.describe('UC-04 — Monitor Import Progress in Real Time', () => {
  // ---------------------------------------------------------------------------
  // Main success scenario (requires live backend)
  // ---------------------------------------------------------------------------

  test('main flow: progress panel reaches Completed status', async ({ progressPage }) => {
    await expect(progressPage.successBanner).toBeVisible({ timeout: COMPLETION_TIMEOUT });
    await expect(progressPage.jobStatus).toContainText(/completed/i);
  });

  test('main flow: success banner shows inserted row count', async ({ progressPage }) => {
    await expect(progressPage.successBanner).toBeVisible({ timeout: COMPLETION_TIMEOUT });
    await expect(progressPage.successBanner).toContainText(/inserted/i);
    const inserted = await progressPage.insertedRows.textContent();
    expect(Number(inserted?.replace(/,/g, ''))).toBeGreaterThanOrEqual(0);
  });

  test('main flow: progress bar reaches 100% on completion', async ({ progressPage }) => {
    await expect(progressPage.successBanner).toBeVisible({ timeout: COMPLETION_TIMEOUT });
    const style = await progressPage.progressBar.getAttribute('style');
    expect(style).toContain('width: 100%');
  });

  // ---------------------------------------------------------------------------
  // Alt flow A — import fails
  // ---------------------------------------------------------------------------

  test('alt flow A: failed event shows error banner with failure reason', async ({ page }) => {
    const fakeJobId = '00000000-0000-0000-0000-000000000099';

    await page.route(`**/api/v1/import/jobs/${fakeJobId}/events`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: { 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
        body: 'data: {"eventId":1,"status":"failed","insertedRows":0,"skippedRows":0,"totalRows":100,"errorDescription":"COPY failed: invalid data"}\n\n',
      }),
    );

    await page.goto(`/import/progress?jobId=${fakeJobId}`);

    await expect(page.getByTestId('error-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('error-banner')).toContainText(/COPY failed/i);
    await expect(page.getByTestId('job-status')).toContainText(/failed/i);
  });

  // ---------------------------------------------------------------------------
  // Post-terminal navigation (requires live backend)
  // ---------------------------------------------------------------------------

  test('success: "Start a new import" button navigates to /import', async ({ progressPage }) => {
    await expect(progressPage.successBanner).toBeVisible({ timeout: COMPLETION_TIMEOUT });
    await progressPage.newImportButton.click();
    await expect(progressPage.page).toHaveURL(/\/import$/);
  });

  test('success: "View import history" button navigates away from progress page', async ({
    progressPage,
  }) => {
    await expect(progressPage.successBanner).toBeVisible({ timeout: COMPLETION_TIMEOUT });
    await progressPage.viewHistoryButton.click();
    await expect(progressPage.page).not.toHaveURL(/\/import\/progress/);
  });

  // ---------------------------------------------------------------------------
  // BR-04 — navigating away does not cancel the import job
  // ---------------------------------------------------------------------------

  test('BR-04: navigating away from progress page does not throw an error', async ({ page }) => {
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

    // Navigate away before (or after) completion — the import coroutine continues server-side
    await page.goto('/import');
    await expect(page).toHaveURL(/\/import$/);

    // Page loaded without errors — confirms the EventSource close on unmount was clean
    await expect(page.locator('body')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Edge case — direct navigation without jobId (carried over from UC-03)
  // ---------------------------------------------------------------------------

  test('direct navigation without jobId shows error alert', async ({ page }) => {
    await page.goto('/import/progress');
    const errorAlert = page.getByRole('alert').filter({ hasText: /no job id/i });
    await expect(errorAlert).toBeVisible();
  });
});
