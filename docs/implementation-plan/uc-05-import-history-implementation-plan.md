# UC-05 — Review Import History: Implementation Plan

**Status:** ✅ Complete
**Use Case:** [docs/use-cases/uc-05-import-history.md](../use-cases/uc-05-import-history.md)

---

## Overview

UC-05 delivers a read-only import history table accessible via a second tab on the `/import` page. The existing import wizard occupies the "New Import" tab; the new "History" tab is a Next.js **async Server Component** that fetches all past import jobs directly from the backend during SSR — the fully-rendered table is sent to the browser with no client-side loading state or fetch waterfall.

The work spans both layers: a new `GET /api/v1/import/jobs` endpoint on the backend that returns all jobs ordered by `started_at DESC`, and a new `HistoryTab` server component on the frontend. Tab switching is handled by a lightweight `'use client'` wrapper that conditionally renders either the wizard (existing client components) or `HistoryTab`. Because `HistoryTab` is a server component, navigating to the History tab triggers a server round-trip that always returns fresh data (BR-01). In-progress jobs are clickable and navigate to the live progress page (`/import/progress?jobId=<id>`). Error descriptions for failed jobs are shown inline in the row.

---

## Files Changed

### Frontend (`data-pumpster-app/`)

| File | Role |
|------|------|
| `app/import/page.tsx` | Convert to a server component that reads a `?tab=` search param; renders `ImportWizard` or `<HistoryTab>` based on the param |
| `app/import/ImportWizard.tsx` | New client component — extracts existing wizard JSX from `page.tsx` so `page.tsx` can become a server component |
| `app/import/HistoryTab.tsx` | New `'use client'` component — fetches `GET /api/v1/import/jobs` on mount, renders history table with status badges, row counts, start time, duration, inline error |
| `app/import/TabBar.tsx` | New `'use client'` component — renders the two tab links (`?tab=new` / `?tab=history`) using `<Link>` with `useSearchParams` for active styling |

### Backend (`data-pumpster-service/`)

| File | Role |
|------|------|
| `web/ImportController.kt` | Add `GET /api/v1/import/jobs` handler that delegates to `ImportJobService` |
| `service/ImportJobService.kt` | Add `listJobs(): List<ImportJobSummary>` — wraps blocking JPA call in `withContext(Dispatchers.IO)` |
| `repository/ImportJobRepository.kt` | Add `findAllByOrderByStartedAtDesc(): List<ImportJob>` |
| `web/dto/ImportJobSummary.kt` | New data class — response DTO with `id`, `status`, `totalRows`, `insertedRows`, `skippedRows`, `errorDescription`, `startedAt`, `completedAt` |
| `src/test/kotlin/.../web/ImportControllerListTest.kt` | Unit test for the new list endpoint |
| `src/test/kotlin/.../service/ImportJobServiceListTest.kt` | Unit test for `listJobs()` |

### E2E Tests (`e2e/`)

| File | Role |
|------|------|
| `tests/uc-05-import-history.spec.ts` | 6 test cases covering main flow, empty state, failed job, in-progress job navigation, and BR assertions |
| `pages/HistoryPage.ts` | Page Object Model for the History tab — locators and helper methods |

---

## Key Design Decisions

### History tab: SSR page shell, client-side data fetch
The page (`page.tsx`) is a Next.js async Server Component — the page structure, tab bar, and metadata are server-rendered. `HistoryTab` is a `'use client'` component that fetches `GET /api/v1/import/jobs` on mount. This hybrid is necessary because Playwright's `page.route()` can only intercept browser-initiated requests; a pure SSR `fetch` inside a server component runs in Node.js and is invisible to browser-level test interception. Fetching on mount also satisfies BR-01 (fresh data on every tab activation) and enables isolated E2E tests via route mocking.

### Tab switching via `?tab=` search param (not client state)
Because `HistoryTab` is a server component, it cannot be toggled by client state alone. The tab switcher uses Next.js `<Link>` components that append `?tab=history` or `?tab=new` to the URL. `page.tsx` (a server component) reads `searchParams.tab` and renders the appropriate child. The default (no param) shows the wizard tab. This keeps the tab selection bookmarkable and avoids a full-page reload feel thanks to Next.js client-side navigation.

### `ImportWizard` extracted to a client component
The existing wizard JSX in `page.tsx` uses context and `'use client'` hooks. Extracting it to `ImportWizard.tsx` lets `page.tsx` shed its `'use client'` directive and become a server component, which is required to directly render `HistoryTab`.

### In-progress jobs navigate to the progress page (Alt Flow B)
A `processing` status row renders as a Next.js `<Link>` to `/import/progress?jobId=<id>`, reusing the existing live-progress UI from UC-04. Since this is a simple anchor, it works inside a server component without a client handler.

### Error description inline in row (Alt Flow C)
Failed jobs show their `error_description` directly in the table row (truncated via CSS `truncate` class, with the full text in a `title` attribute), rather than a hover tooltip or expandable row.

### Blocking JPA wrapped in `Dispatchers.IO`
`ImportJobRepository.findAllByOrderByStartedAtDesc()` is a synchronous JPA call. Per the architecture policy, `ImportJobService.listJobs()` dispatches via `withContext(Dispatchers.IO)` and is declared `suspend`. The controller invokes it through a coroutine-aware WebFlux handler (`coRouter` or `@GetMapping` with `suspend` on the controller function).

### Response DTO (no entity leak)
A dedicated `ImportJobSummary` DTO is returned rather than the JPA entity directly. This prevents accidental exposure of future private fields and gives a stable API contract.

---

## Processing / State Flow

```
Browser navigates to /import?tab=history
  └─ Next.js server renders page.tsx
       └─ reads searchParams.tab = "history"
       └─ renders <HistoryTab> (async server component)
            └─ fetch GET /api/v1/import/jobs  [cache: no-store]
                 └─ ImportController.listJobs()
                      └─ ImportJobService.listJobs()  [suspend, Dispatchers.IO]
                           └─ ImportJobRepository.findAllByOrderByStartedAtDesc()
                           └─ map ImportJob → ImportJobSummary
                      └─ return List<ImportJobSummary> (200 OK)
            └─ empty list → empty state with "Start your first import" CTA
            └─ jobs present → render HTML table
                 ├─ status badge (Pending / Processing / Completed / Failed)
                 ├─ totalRows / insertedRows / skippedRows
                 ├─ startedAt (formatted)
                 ├─ duration (completedAt − startedAt, or "—" if running)
                 ├─ errorDescription inline if status = failed
                 └─ Processing rows render as <Link> → /import/progress?jobId=<id>
  └─ Fully rendered HTML sent to browser (no client JS needed for data)
```

---

## Business Rules Enforced

| Rule | Where enforced |
|------|----------------|
| BR-01: History always reflects current state — no stale cache | `HistoryTab` fetches on every mount — switching to the History tab always triggers a fresh request; no client-side cache |
| BR-02: All jobs shown (pending, processing, completed, failed) | `findAllByOrderByStartedAtDesc()` returns every row with no filter |
| BR-03: Jobs ordered by start time, most recent first | `findAllByOrderByStartedAtDesc()` Spring Data method name sorts by `started_at DESC` |
| BR-04: History is read-only; no edit/delete controls | `HistoryTab` renders no action buttons; backend exposes no mutation endpoint for this UC |

---

## E2E Test Coverage

| Test | Scenario |
|------|----------|
| History tab is visible and switches view on /import | Tab navigation (main flow entry) |
| Completed jobs appear in history table with correct columns | Main success scenario |
| Empty state is shown when no jobs exist | Alternative Flow A |
| Failed job shows error description inline | Alternative Flow C |
| Processing job row navigates to /import/progress | Alternative Flow B |
| Jobs are ordered most-recent first | BR-03 assertion |
