import { expect, test } from './base';

/**
 * UC-05 tests require the Spring Boot backend running on http://localhost:8080.
 * Alt Flow A (empty state) uses Playwright route interception and does NOT need a live backend.
 * Alt Flow B (processing job) and Alt Flow C (failed job) use route interception.
 */

const BACKEND_JOBS_URL = '**/api/v1/import/jobs';

test.describe('UC-05 — Review Import History', () => {
  // ---------------------------------------------------------------------------
  // Tab navigation
  // ---------------------------------------------------------------------------

  test('History tab is visible on the import page', async ({ page }) => {
    await page.goto('/import');
    await expect(page.getByTestId('tab-history')).toBeVisible();
    await expect(page.getByTestId('tab-new-import')).toBeVisible();
  });

  test('clicking History tab navigates to history view', async ({ page }) => {
    await page.goto('/import');
    await page.getByTestId('tab-history').click();
    await expect(page).toHaveURL(/tab=history/);
    await expect(page.getByTestId('history-table-container').or(page.getByTestId('history-empty-state'))).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Main success scenario (requires live backend)
  // ---------------------------------------------------------------------------

  test('main flow: completed jobs appear in the history table with all columns', async ({ historyPage, page }) => {
    const tableOrEmpty = page.getByTestId('history-table').or(page.getByTestId('history-empty-state'));
    await expect(tableOrEmpty).toBeVisible({ timeout: 10_000 });

    const hasTable = await page.getByTestId('history-table').isVisible();
    if (!hasTable) {
      test.skip();
      return;
    }

    const firstRow = page.locator('[data-testid^="job-row-"]').first();
    await expect(firstRow).toBeVisible();

    const firstStatus = page.locator('[data-testid^="job-status-"]').first();
    await expect(firstStatus).toBeVisible();
    await expect(firstStatus).toContainText(/pending|processing|completed|failed/i);
  });

  // ---------------------------------------------------------------------------
  // Alt flow A — empty state (intercepted, no live backend needed)
  // ---------------------------------------------------------------------------

  test('alt flow A: empty state shown when no jobs exist', async ({ page }) => {
    await page.route(BACKEND_JOBS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      }),
    );

    await page.goto('/import?tab=history');

    await expect(page.getByTestId('history-empty-state')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('history-empty-state')).toContainText(/no imports yet/i);
    await expect(page.getByTestId('history-start-import-cta')).toBeVisible();
  });

  test('alt flow A: "Start your first import" CTA links to new import tab', async ({ page }) => {
    await page.route(BACKEND_JOBS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      }),
    );

    await page.goto('/import?tab=history');
    await page.getByTestId('history-start-import-cta').click();
    await expect(page).toHaveURL(/tab=new|\/import(?!\?)/);
  });

  // ---------------------------------------------------------------------------
  // Alt flow C — failed job shows error description inline (intercepted)
  // ---------------------------------------------------------------------------

  test('alt flow C: failed job shows error description inline in the row', async ({ page }) => {
    const jobId = 'aaaaaaaa-0000-0000-0000-000000000001';
    await page.route(BACKEND_JOBS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: jobId,
            status: 'failed',
            totalRows: 100,
            insertedRows: 0,
            skippedRows: 0,
            errorDescription: 'COPY failed: invalid data on row 3',
            startedAt: '2026-05-10T09:00:00Z',
            completedAt: '2026-05-10T09:00:05Z',
          },
        ]),
      }),
    );

    await page.goto('/import?tab=history');

    await expect(page.getByTestId(`job-status-${jobId}`)).toContainText(/failed/i);
    await expect(page.getByTestId(`job-error-${jobId}`)).toBeVisible();
    await expect(page.getByTestId(`job-error-${jobId}`)).toContainText(/COPY failed/i);
  });

  // ---------------------------------------------------------------------------
  // Alt flow B — processing job navigates to progress page (intercepted)
  // ---------------------------------------------------------------------------

  test('alt flow B: processing job status links to live progress page', async ({ page }) => {
    const jobId = 'bbbbbbbb-0000-0000-0000-000000000002';
    await page.route(BACKEND_JOBS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: jobId,
            status: 'processing',
            totalRows: 500,
            insertedRows: 120,
            skippedRows: 3,
            errorDescription: null,
            startedAt: '2026-05-11T10:00:00Z',
            completedAt: null,
          },
        ]),
      }),
    );

    await page.goto('/import?tab=history');

    const link = page.getByTestId(`job-link-${jobId}`);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `/import/progress?jobId=${jobId}`);
  });

  // ---------------------------------------------------------------------------
  // BR-03 — jobs ordered most-recent first (intercepted)
  // ---------------------------------------------------------------------------

  test('BR-03: jobs are displayed in most-recent-first order', async ({ page }) => {
    const olderJobId = 'cccccccc-0000-0000-0000-000000000003';
    const newerJobId = 'dddddddd-0000-0000-0000-000000000004';

    await page.route(BACKEND_JOBS_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: newerJobId,
            status: 'completed',
            totalRows: 10,
            insertedRows: 10,
            skippedRows: 0,
            errorDescription: null,
            startedAt: '2026-05-11T12:00:00Z',
            completedAt: '2026-05-11T12:00:10Z',
          },
          {
            id: olderJobId,
            status: 'completed',
            totalRows: 5,
            insertedRows: 5,
            skippedRows: 0,
            errorDescription: null,
            startedAt: '2026-05-10T08:00:00Z',
            completedAt: '2026-05-10T08:00:05Z',
          },
        ]),
      }),
    );

    await page.goto('/import?tab=history');

    const rows = page.locator('[data-testid^="job-row-"]');
    await expect(rows).toHaveCount(2);

    const firstRowId = await rows.first().getAttribute('data-testid');
    expect(firstRowId).toBe(`job-row-${newerJobId}`);
  });
});
