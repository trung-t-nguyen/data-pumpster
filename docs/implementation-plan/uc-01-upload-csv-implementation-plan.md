# UC-01 — Upload a Product CSV File: Implementation Plan

**Version:** v1.0.0
**Status:** Complete — [PR #1](https://github.com/trung-t-nguyen/data-pumpster/pull/1)
**Use Case:** [docs/use-cases/uc-01-upload-csv.md](../use-cases/uc-01-upload-csv.md)

---

## Overview

UC-01 is entirely client-side. No data leaves the browser during this step (BR-03). The work splits into three areas: the upload UI, the background CSV parser, and the shared state that hands parsed results to later steps.

---

## Files Changed

### Frontend (`data-pumpster-app/`)

| File | Role |
|------|------|
| `app/import/layout.tsx` | Wraps the 3-step wizard routes; provides `ImportContext` to all child pages |
| `app/import/ImportContext.tsx` | React Context holding `ParsedFile` (file object, headers, rowCount) and `ColumnMapping`; `setParsed` / `setMapping` actions |
| `app/import/page.tsx` | Upload page: renders `WizardSteps` (step 1 of 3) and `UploadZone` |
| `app/import/WizardSteps.tsx` | Step indicator component showing Upload → Map Columns → Import |
| `app/import/UploadZone.tsx` | Core upload component: drag-and-drop + click-to-browse, CSV extension guard, Web Worker invocation, state machine (idle → processing → done / error), large-file warning |
| `app/import/csv.worker.ts` | Web Worker: Phase 1 extracts headers (`preview: 1`); Phase 2 streams the file to count rows — both via PapaParse |

### E2E Tests (`e2e/`)

| File | Role |
|------|------|
| `tests/uc-01-upload-csv.spec.ts` | 8 Playwright test cases covering success scenario and all three alternative flows |
| `pages/ImportPage.ts` | Page Object Model for the upload page (locators + helper methods) |
| `tests/base.ts` | Base fixture that pre-navigates to `/import` before each test |
| `fixtures/valid.csv` | 9-row product CSV (SKU, name, price, etc.) for the happy path |
| `fixtures/empty.csv` | Zero-byte file for alternative flow C (empty file) |
| `fixtures/headers-only.csv` | Header row with 0 data rows for the zero-row edge case |

> No backend changes were needed for UC-01 — file transmission to the server happens in UC-03.

---

## Key Design Decisions

### Web Worker for parsing (BR-02)
PapaParse runs inside a dedicated Web Worker (`csv.worker.ts`) so the browser UI stays responsive on large files. The worker posts two messages back to the main thread: one with headers after a fast `preview: 1` parse, and one with the final row count after a full streaming pass.

### Two-phase parsing
Phase 1 (`preview: 1`) returns immediately with headers. Phase 2 streams the whole file row-by-row to count rows. This gives instant feedback on headers while the row count accumulates in the background.

### Client-side state via React Context
`ImportContext` holds the `ParsedFile` object (the raw `File` reference, headers array, and rowCount). Downstream steps (UC-02, UC-03) read from the same context rather than re-parsing the file.

### Large-file warning (Alternative Flow B)
A non-blocking warning is shown when the file exceeds 500 MB. Parsing continues normally — the warning is purely informational.

---

## State Machine (`UploadZone`)

```
idle
 └─(file selected / dropped)─► processing
                                  ├─(worker done)─► done
                                  └─(error)────────► error
error / done
 └─(reset)──────────────────────► idle
```

---

## Business Rules Enforced

| Rule | Where enforced |
|------|---------------|
| BR-01: CSV files only | `UploadZone.tsx` — extension check before worker is started |
| BR-02: Non-blocking parse | `csv.worker.ts` — PapaParse runs off the main thread |
| BR-03: No server transmission | No `fetch` / API call in UC-01 scope; E2E test asserts zero network requests |

---

## E2E Test Coverage

| Test | Scenario |
|------|----------|
| Upload zone is visible on load | Precondition check |
| Valid CSV → shows headers + row count | Main success scenario |
| Non-CSV file → rejection message | Alternative flow A |
| File > 500 MB → warning shown, continues | Alternative flow B |
| Empty file → error message | Alternative flow C |
| Headers-only file → zero-row error | Alternative flow C (edge case) |
| Reset button → returns to idle | Reset path |
| No network requests during parse | BR-03 assertion |
