import { expect, test } from './base';
import { SCHEMA_COLUMNS } from '../pages/MapPage';

test.describe('UC-02 — Map CSV Columns to Product Schema', () => {
  // -------------------------------------------------------------------------
  // Page load + auto-mapping
  // -------------------------------------------------------------------------

  test('shows all 9 schema columns with dropdowns', async ({ mapPage }) => {
    for (const col of SCHEMA_COLUMNS) {
      await expect(mapPage.page.getByText(col.label, { exact: true }).first()).toBeVisible();
    }
    await expect(mapPage.startImportButton).toBeVisible();
  });

  test('Required badge shown on SKU, Name, and Price only', async ({ mapPage }) => {
    const requiredBadges = mapPage.page.getByTestId('required-badge');
    await expect(requiredBadges).toHaveCount(3);
  });

  test('auto-maps normalised column names from valid.csv', async ({ mapPage }) => {
    // valid.csv has: sku, product_name, unit_price, category, brand_name, product_desc, weight
    // "sku" normalises to "sku"  → matches DB "sku"
    // "brand_name" normalises to "brandname" which does NOT match "brand" — left unmapped
    const skuTrigger = mapPage.triggerFor('SKU');
    await expect(skuTrigger).toContainText('sku');
  });

  // -------------------------------------------------------------------------
  // Main success scenario
  // -------------------------------------------------------------------------

  test('main flow: operator corrects mapping and clicks Start Import', async ({ mapPage }) => {
    // Map the three required fields (sku is auto-mapped; manually map Name & Price)
    await mapPage.selectMapping('Name', 'product_name');
    await mapPage.selectMapping('Price', 'unit_price');

    await mapPage.startImportButton.click();

    // Expects navigation to /import/progress (requires live backend)
    await expect(mapPage.page).not.toHaveURL(/\/import\/map/);
  });

  // -------------------------------------------------------------------------
  // Alt flow A — auto-map fills everything correctly
  // -------------------------------------------------------------------------

  test('alt flow A: when all required fields are auto-mapped, Start Import is enabled', async ({ mapPage }) => {
    // Manually set required fields that may not be auto-mapped from valid.csv
    await mapPage.selectMapping('Name', 'product_name');
    await mapPage.selectMapping('Price', 'unit_price');

    // Start Import should be clickable without showing validation errors
    await mapPage.startImportButton.click();
    await expect(mapPage.errorFor('SKU')).not.toBeVisible();
    await expect(mapPage.errorFor('Name')).not.toBeVisible();
    await expect(mapPage.errorFor('Price')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Alt flow B — required field left unmapped
  // -------------------------------------------------------------------------

  test('alt flow B: missing required field shows inline error', async ({ mapPage }) => {
    // Clear the auto-mapped SKU so it is unmapped, leave Name and Price unmapped too
    await mapPage.selectMapping('SKU', '— None —');
    await mapPage.startImportButton.click();

    await expect(mapPage.errorFor('SKU')).toBeVisible();
    await expect(mapPage.errorFor('Name')).toBeVisible();
    await expect(mapPage.errorFor('Price')).toBeVisible();

    // Still on the mapping page
    await expect(mapPage.page).toHaveURL(/\/import\/map/);
  });

  test('alt flow B: error clears when field is subsequently mapped', async ({ mapPage }) => {
    await mapPage.startImportButton.click();
    await expect(mapPage.errorFor('Name')).toBeVisible();

    await mapPage.selectMapping('Name', 'product_name');

    await expect(mapPage.errorFor('Name')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Alt flow C — optional field skipped
  // -------------------------------------------------------------------------

  test('alt flow C: optional fields can be left unmapped and import proceeds', async ({ mapPage }) => {
    await mapPage.selectMapping('Name', 'product_name');
    await mapPage.selectMapping('Price', 'unit_price');
    // Leave Description, Brand, etc. unmapped

    await mapPage.startImportButton.click();

    // No field-validation errors shown for optional fields
    // (uses a text filter to exclude the Next.js route-change announcer)
    await expect(
      mapPage.page.getByRole('alert').filter({ hasText: /is required to proceed/ }),
    ).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // BR-02 — duplicate mapping warning
  // -------------------------------------------------------------------------

  test('BR-02: duplicate CSV header selection shows inline warning', async ({ mapPage }) => {
    // Map both SKU and Name to the same CSV header "sku"
    await mapPage.selectMapping('Name', 'sku');

    await expect(
      mapPage.page.getByText('This CSV column is already mapped elsewhere.').first(),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // BR-03 / BR-04 — system columns never shown
  // -------------------------------------------------------------------------

  test('BR-03/BR-04: system columns (id, job_id, created_at, updated_at) are not shown', async ({ mapPage }) => {
    for (const hidden of ['id', 'job_id', 'created_at', 'updated_at']) {
      await expect(
        mapPage.page.getByText(hidden, { exact: true }),
      ).not.toBeVisible();
    }
  });

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  test('Back button returns to upload page', async ({ mapPage }) => {
    await mapPage.backButton.click();
    await expect(mapPage.page).toHaveURL(/\/import$/);
  });

  test('direct navigation to /import/map without upload redirects to /import', async ({ page }) => {
    await page.goto('/import/map');
    await expect(page).toHaveURL(/\/import$/);
  });
});
