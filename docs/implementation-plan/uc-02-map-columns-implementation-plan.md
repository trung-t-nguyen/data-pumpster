# UC-02 — Map CSV Columns to Product Schema: Implementation Plan

**Status:** Complete — [PR #2](https://github.com/trung-t-nguyen/data-pumpster/pull/2)
**Use Case:** [docs/use-cases/uc-02-map-columns.md](../use-cases/uc-02-map-columns.md)

---

## Overview

UC-02 is entirely client-side. It reads the parsed file from `ImportContext` (populated by UC-01), renders a dropdown per schema column, auto-matches headers, validates required fields, and delegates submission to UC-03 (`MappingPanel` calls the backend directly).

---

## Files Changed

### Frontend (`data-pumpster-app/`)

| File | Role |
|------|------|
| `app/import/map/page.tsx` | Mapping page: renders `WizardSteps` (step 2 of 3) and `MappingPanel` |
| `app/import/map/schema.ts` | Schema column definitions, Zod validation, `buildAutoMapping()`, `findDuplicateMappings()` |
| `app/import/map/MappingPanel.tsx` | Core mapping component: dropdowns, auto-fill, validation errors, duplicate warnings, submission |

### E2E Tests (`e2e/`)

| File | Role |
|------|------|
| `tests/uc-02-map-columns.spec.ts` | 13 test cases covering success scenario and all alternative flows |
| `pages/MapPage.ts` | Page Object Model for the mapping page with `SCHEMA_COLUMNS` constant and helper methods |
| `tests/base.ts` | Extended with `mapPage` fixture that pre-navigates via a full UC-01 upload flow |

---

## Key Design Decisions

### Schema defined in one place (`schema.ts`)
All column metadata (db key, display label, required flag) lives in `schema.ts`. The same array drives the UI rows, the auto-mapping logic, the Zod validator, and the E2E `SCHEMA_COLUMNS` constant — one source of truth.

### Auto-mapping via normalized comparison
`buildAutoMapping()` normalises both CSV headers and schema labels (lowercase, strip dashes/underscores/spaces) before comparing. A header like `"Product Code"` matches `sku`; `"weight_kg"` matches `weight_kg` exactly. Each CSV header is consumed at most once to prevent accidental duplicates.

### Mapping stored as `Record<dbColumn, csvHeader>`
The mapping state is a plain object keyed by database column name. This format is validated by Zod, serialised to JSON, and posted directly to the backend in UC-03 — no transformation needed between steps.

### Duplicate detection via frequency counter
`findDuplicateMappings()` counts how many times each CSV header appears in the current mapping. Any header used more than once triggers an inline warning. The operator can still submit — duplicates are warned, not blocked — because the duplicate constraint (BR-02) is enforced by the backend at the per-column level.

### Submission lives in `MappingPanel`
`MappingPanel` owns the `POST /api/v1/import/jobs` call. This keeps UC-02 and UC-03 decoupled at the use-case boundary: UC-02 produces a validated mapping; UC-03's backend endpoint consumes it. The frontend bridge is a single `fetch` with `FormData` (file + mapping JSON + totalRows).

---

## Business Rules Enforced

| Rule | Where enforced |
|------|---------------|
| BR-01: SKU, Name, Price required | Zod schema in `schema.ts`; inline errors in `MappingPanel` |
| BR-02: Each CSV header at most once | `findDuplicateMappings()` in `schema.ts`; warning rendered in `MappingPanel` |
| BR-03: System columns not shown | `SCHEMA_COLUMNS` in `schema.ts` excludes `id`, `created_at`, `updated_at` |
| BR-04: `job_id` injected by backend | Not present in mapping UI; added server-side in `ImportJobService` |

---

## E2E Test Coverage

| Test | Scenario |
|------|----------|
| Page renders 9 schema columns | Precondition / column list |
| Required badges shown on SKU, Name, Price | BR-01 visual indicator |
| Auto-mapping pre-fills normalized headers | Main success scenario step 2 |
| Submit with corrected mappings → navigates | Main success scenario steps 3–5 |
| All columns auto-matched → operator confirms | Alternative flow A |
| Missing required field → inline error | Alternative flow B |
| Optional fields left unmapped → accepted | Alternative flow C |
| Duplicate CSV header → warning shown | BR-02 warning |
| System columns (id, job_id, etc.) not shown | BR-03 |
| Back button returns to upload step | Navigation |
