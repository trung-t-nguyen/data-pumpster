import { test as base } from '@playwright/test';
import { ImportPage } from '../pages/ImportPage';

type Pages = {
  importPage: ImportPage;
};

/**
 * Extended test fixture that pre-navigates to each page and exposes POMs
 * as named parameters. Add a new entry here for each future use-case page.
 */
export const test = base.extend<Pages>({
  importPage: async ({ page }, use) => {
    const importPage = new ImportPage(page);
    await importPage.goto();
    await use(importPage);
  },
});

export { expect } from '@playwright/test';
