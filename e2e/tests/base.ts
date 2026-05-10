import { test as base } from '@playwright/test';
import { ImportPage } from '../pages/ImportPage';
import { MapPage, navigateToMapViaUpload } from '../pages/MapPage';
import { ProgressPage, navigateToProgressViaFullFlow } from '../pages/ProgressPage';

type Pages = {
  importPage: ImportPage;
  /** Pre-navigated to /import/map via a real UC-01 upload flow. */
  mapPage: MapPage;
  /** Pre-navigated to /import/progress via the full upload → map → submit flow (requires live backend). */
  progressPage: ProgressPage;
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

  mapPage: async ({ page }, use) => {
    await navigateToMapViaUpload(page);
    await use(new MapPage(page));
  },

  progressPage: async ({ page }, use) => {
    await navigateToProgressViaFullFlow(page);
    await use(new ProgressPage(page));
  },
});

export { expect } from '@playwright/test';
