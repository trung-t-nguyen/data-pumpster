import { type Locator, type Page } from '@playwright/test';
import path from 'path';

export class ImportPage {
  readonly uploadZone: Locator;
  readonly fileInput: Locator;
  readonly spinner: Locator;
  readonly resultsPanel: Locator;
  readonly rowsLabel: Locator;
  readonly continueButton: Locator;
  readonly resetButton: Locator;
  readonly largeFileWarning: Locator;

  constructor(readonly page: Page) {
    this.uploadZone = page.getByRole('button', { name: 'Upload CSV file' });
    this.fileInput = page.locator('input[type="file"]');
    this.spinner = page.getByText('Analysing file…');
    this.resultsPanel = page.getByText(/detected columns/i);
    this.rowsLabel = page.getByText('Rows', { exact: true });
    this.continueButton = page.getByRole('button', { name: /continue to column mapping/i });
    this.resetButton = page.getByRole('button', { name: 'Choose different file' });
    this.largeFileWarning = page.getByText(/large file detected/i).first();
  }

  async goto() {
    await this.page.goto('/import');
  }

  async uploadFixture(filename: string) {
    await this.fileInput.setInputFiles(
      path.join(__dirname, '../fixtures', filename),
    );
  }

  async dropLargeFile() {
    await this.page.evaluate(() => {
      const file = new File(['sku,name,price\nABC-1,Widget,9.99'], 'huge.csv', {
        type: 'text/csv',
      });
      Object.defineProperty(file, 'size', { value: 600 * 1024 * 1024, configurable: true });
      const dt = new DataTransfer();
      dt.items.add(file);
      document
        .querySelector('[aria-label="Upload CSV file"]')
        ?.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    });
  }

  async waitForResults(timeout = 15_000) {
    await this.resultsPanel.waitFor({ state: 'visible', timeout });
  }
}
