# UC-03 — Submit an Import Job: Implementation Plan

**Status:** Complete — [PR #3](https://github.com/trung-t-nguyen/data-pumpster/pull/3)
**Use Case:** [docs/use-cases/uc-03-submit-import.md](../use-cases/uc-03-submit-import.md)

---

## Overview

UC-03 spans both layers. The frontend (`MappingPanel`) posts the CSV file and mapping to the backend, which immediately returns a `jobId` (202 ACCEPTED) and processes the import asynchronously in a background coroutine. The UI navigates to the progress page with the `jobId` in the query string.

---

## Files Changed

### Frontend (`data-pumpster-app/`)

| File | Role |
|------|------|
| `app/import/map/MappingPanel.tsx` | Submits `FormData` (file + mapping JSON + totalRows) to `POST /api/v1/import/jobs`; handles loading, network error, and backend rejection states; navigates to `/import/progress?jobId=<uuid>` on 202 |
| `app/import/progress/page.tsx` | Progress page: reads `jobId` query param, renders `WizardSteps` (step 3 of 3) and `ProgressPanel` |
| `app/import/progress/ProgressPanel.tsx` | Displays job ID and "Pending" status badge; placeholder for real-time streaming (UC-04) |

### Backend (`data-pumpster-server/`)

| File | Role |
|------|------|
| `web/ImportController.kt` | `POST /api/v1/import/jobs` — extracts multipart parts, validates presence, delegates to `ImportJobService`, returns 202 `{ jobId }` |
| `service/ImportJobService.kt` | Creates `ImportJob` (status=pending), returns jobId, launches background coroutine to run the full COPY pipeline |
| `domain/ImportJob.kt` | JPA entity for `import_jobs` table — tracks status, row counts, timestamps, error |
| `domain/Product.kt` | JPA entity for `products` table — includes `jobId` FK for traceability (BR-02) |
| `repository/ImportJobRepository.kt` | Spring Data JPA repository for `ImportJob` |
| `config/AppConfig.kt` | Application-scoped `CoroutineScope` (backed by `SupervisorJob`) used to outlive the HTTP request |
| `config/WebConfig.kt` | CORS config allowing `POST /api/**` from `http://localhost:3000` |

### E2E Tests (`e2e/`)

| File | Role |
|------|------|
| `tests/uc-03-submit-import.spec.ts` | 13 test cases covering success flow, loading state, network errors, backend rejection, job ID format |
| `pages/ProgressPage.ts` | Page Object Model for the progress page with `jobId` / `jobStatus` locators and `navigateToProgressViaFullFlow()` helper |
| `tests/base.ts` | Extended with `progressPage` fixture that runs the full upload → map → submit flow |

---

## Key Design Decisions

### 202 ACCEPTED for async processing (BR-01)
`ImportController` returns 202 immediately after saving the `ImportJob` record. The browser is not kept waiting for the actual CSV processing. The background coroutine is launched via an application-scoped `SupervisorJob` so it survives HTTP request completion.

### PostgreSQL COPY for bulk insert (BR-03)
`ImportJobService.copyData()` builds a transformed CSV in memory (applying the column mapping), loads it into a temporary staging table via `COPY`, then inserts into `products` with `INSERT … SELECT … ON CONFLICT (sku) DO NOTHING`. This avoids row-by-row ORM writes and scales to millions of rows.

### Two-stage pipeline: staging → products
A temporary staging table holds the raw transformed CSV with all-text columns. The final `INSERT … SELECT` does type casting, `COALESCE` for NULLs, and attaches `jobId`. This isolates parsing from persistence and makes the transformation explicit.

### Duplicate SKU handling (BR-05)
`ON CONFLICT (sku) DO NOTHING` silently skips rows that violate the unique constraint. `insertedRows` and `skippedRows` are computed by comparing the staging row count against the actual rows inserted, and both are recorded on the `ImportJob`.

### Job ID passed via URL query param
After receiving the 202, the frontend navigates to `/import/progress?jobId=<uuid>`. The `ProgressPanel` reads it from `searchParams`. This makes the job linkable and survives a page refresh — no reliance on React Context for the job ID.

### Error boundaries
- **Network error** (request never reaches server): caught in `MappingPanel` fetch `catch`; shows retry message.
- **Backend 4xx** (e.g. missing required mapping): server error text is shown inline.
- **Mid-stream failure**: coroutine catches the exception, sets `ImportJob.status = "failed"` with `errorDescription`, and the progress page (UC-04) surfaces it.

---

## Background Processing Flow

```
POST /api/v1/import/jobs
  │
  ├─► validate multipart parts
  ├─► deserialize mapping JSON
  ├─► validate required fields (sku, name, price)
  ├─► save ImportJob (status=pending)
  ├─► return 202 { jobId }           ← browser unblocked here
  │
  └─► coroutine (AppScope)
        ├─► set status = processing
        ├─► build transformed CSV (apply mapping)
        ├─► CREATE TEMP TABLE staging (...)
        ├─► COPY staging FROM STDIN
        ├─► INSERT INTO products SELECT ... FROM staging ON CONFLICT (sku) DO NOTHING
        ├─► count insertedRows / skippedRows
        └─► set status = completed | failed
```

---

## Business Rules Enforced

| Rule | Where enforced |
|------|---------------|
| BR-01: Immediate 202 response | `ImportController` returns before coroutine starts |
| BR-02: `job_id` on every product row | `INSERT … SELECT` injects `jobId`; `Product.jobId` FK field |
| BR-03: COPY protocol for bulk insert | `copyData()` uses `COPY` command, not ORM save |
| BR-04: Unmapped columns → NULL | `COALESCE` in `INSERT … SELECT`; optional columns default to `NULL` |
| BR-05: Duplicate SKUs skipped | `ON CONFLICT (sku) DO NOTHING`; skipped rows counted |

---

## E2E Test Coverage

| Test | Scenario |
|------|----------|
| Submit valid mapping → progress page with job ID | Main success scenario |
| Job ID matches UUID format | BR-02 / traceability |
| "Pending" status shown on arrival | Postcondition check |
| Loading spinner shown during submission | UX / loading state |
| Network error → error message shown | Alternative flow A |
| Network error → retry re-submits | Alternative flow A recovery |
| Backend 400 → server message shown | Alternative flow B |
| Missing jobId in URL → handled gracefully | Edge case |
