import { type Locator, type Page } from '@playwright/test';

export class HistoryPage {
  readonly tabHistory: Locator;
  readonly tabNewImport: Locator;
  readonly emptyState: Locator;
  readonly startImportCta: Locator;
  readonly table: Locator;

  constructor(readonly page: Page) {
    this.tabHistory = page.getByTestId('tab-history');
    this.tabNewImport = page.getByTestId('tab-new-import');
    this.emptyState = page.getByTestId('history-empty-state');
    this.startImportCta = page.getByTestId('history-start-import-cta');
    this.table = page.getByTestId('history-table');
  }

  async gotoHistoryTab() {
    await this.page.goto('/import?tab=history');
  }

  async gotoNewImportTab() {
    await this.page.goto('/import?tab=new');
  }

  jobRow(jobId: string): Locator {
    return this.page.getByTestId(`job-row-${jobId}`);
  }

  jobStatus(jobId: string): Locator {
    return this.page.getByTestId(`job-status-${jobId}`);
  }

  jobError(jobId: string): Locator {
    return this.page.getByTestId(`job-error-${jobId}`);
  }

  jobLink(jobId: string): Locator {
    return this.page.getByTestId(`job-link-${jobId}`);
  }
}
