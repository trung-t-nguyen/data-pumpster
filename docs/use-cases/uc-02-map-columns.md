# UC-02 — Map CSV Columns to Product Schema

**Status:** ⬜ Not started
**Actor:** Data Operator
**Goal:** Align the supplier's CSV column names with the product database schema so the system knows how to interpret each field.

---

## Business Context

Supplier files rarely use the same column names as the internal product schema. A supplier might call the stock code `"Product Code"` while the database expects `sku`. This step puts the operator in control of that translation before any data is written, preventing silent data corruption.

---

## Preconditions

- UC-01 has completed successfully.
- The system holds the list of CSV headers and the file object in memory.

---

## Main Success Scenario

1. The system displays the target product schema columns alongside a dropdown for each.
2. The system attempts to auto-match CSV headers to schema columns based on name similarity and pre-fills the dropdowns accordingly.
3. The operator reviews the auto-mapped suggestions and corrects any mismatches using the dropdowns.
4. The operator maps the three required fields: **SKU**, **Name**, and **Price**.
5. The operator clicks **"Start Import"**.
6. The system validates that all required fields are mapped and submits the import (UC-03).

---

## Alternative Flows

**A — Auto-map fills everything correctly**
- At step 3: all required fields are matched. The operator simply confirms and proceeds to step 5.

**B — Required field left unmapped**
- At step 5: one or more required fields (`SKU`, `Name`, `Price`) have no mapping selected.
- The system highlights the missing fields and shows: *"[Field] is required to proceed."*
- The operator resolves the gaps and retries step 5.

**C — Optional field skipped**
- The operator intentionally leaves optional fields (e.g. `Description`, `Brand`) unmapped.
- The system accepts this; those columns will receive a `NULL` value in the database.

---

## Postconditions

- A confirmed column mapping exists: each target database column is either linked to a CSV header or intentionally left blank.
- The mapping is ready to be sent to the backend alongside the file (UC-03).

---

## Business Rules

- BR-01: `SKU`, `Name`, and `Price` are mandatory mappings; the import cannot proceed without them.
- BR-02: Each CSV header may be mapped to at most one database column.
- BR-03: Database system columns (`id`, `created_at`, `updated_at`) are never shown to the operator — they are always managed by the system.
- BR-04: The `job_id` column is automatically injected by the backend and is not part of the mapping UI.

---

## Target Schema Columns Available for Mapping

| Database Column | Label | Required |
|---|---|---|
| `sku` | SKU | Yes |
| `name` | Name | Yes |
| `price` | Price | Yes |
| `description` | Description | No |
| `currency` | Currency | No |
| `category_id` | Category ID | No |
| `brand` | Brand | No |
| `weight_kg` | Weight (kg) | No |
| `is_active` | Active? | No |
