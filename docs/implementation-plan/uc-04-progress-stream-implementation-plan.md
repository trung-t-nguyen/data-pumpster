# UC-04 — Monitor Import Progress in Real Time: Implementation Plan

**Status:** In Progress
**Use Case:** [docs/use-cases/uc-04-progress-stream.md](../use-cases/uc-04-progress-stream.md)

---

## Overview

UC-04 adds a live SSE stream that pushes status-transition events from the backend to the `ProgressPanel` component. The browser opens an `EventSource` connection to `GET /api/v1/import/jobs/{jobId}/events`, which emits up to three events per job: `processing` (import started), then `completed` or `failed` (terminal). The progress bar shows an indeterminate animated state while processing and fills to 100% on completion.

The backend introduces a `ProgressService` bean that holds a per-job `Sinks.Many<ProgressEvent>` and an in-memory event history list. This enables event replay on reconnect via the `Last-Event-ID` header. Late-connecting clients (job already terminal) get the final event immediately — either from in-memory history or from a DB fallback. The existing bulk COPY pipeline is retained unchanged; `ProgressService.emit()` is called at each status transition inside `processImport`.

This UC spans both layers: backend adds the SSE endpoint and wires event emission into the import pipeline; frontend replaces the placeholder `ProgressPanel` with a full reactive component.

---

## Files Changed

### Frontend (`data-pumpster-app/`)

| File | Role |
|------|------|
| `app/import/progress/ProgressPanel.tsx` | Full rewrite: opens `EventSource` on mount, renders status badge, indeterminate progress bar, row counters, terminal banners (green/red), and post-finish navigation buttons |

### Backend (`data-pumpster-service/`)

| File | Role |
|------|------|
| `domain/ProgressEvent.kt` | Data class for SSE payload: `eventId`, `status`, `insertedRows`, `skippedRows`, `totalRows`, `errorDescription` |
| `service/ProgressService.kt` | Manages per-job `Sinks.Many<ProgressEvent>` + `CopyOnWriteArrayList<ProgressEvent>` history; exposes `createStream`, `emit`, and `streamFrom(jobId, afterEventId)` |
| `service/ImportJobService.kt` | Inject `ProgressService`; call `createStream` before launching the coroutine, `emit(processing)` at start, `emit(completed/failed)` at each terminal transition |
| `web/ImportController.kt` | Add `GET /api/v1/import/jobs/{jobId}/events` SSE endpoint; reads `Last-Event-ID` header; falls back to DB reconstruction if no in-memory stream exists |

### Tests (`data-pumpster-service/src/test/kotlin/`)

| File | Role |
|------|------|
| `service/ProgressServiceTest.kt` | Unit tests: create + emit happy path; history replay after `Last-Event-ID`; late-connect returns history then completes; unknown job returns empty Flux |
| `web/ImportControllerSseTest.kt` | Unit tests: 200 SSE response for known in-progress job; 404 for unknown job; late-connect terminal event from DB fallback |

### E2E Tests (`e2e/`)

| File | Role |
|------|------|
| `tests/uc-04-progress-stream.spec.ts` | 6 test cases covering success flow, failure flow, final summary counts, progress bar state, disconnect-safe (BR-04), and late-connect terminal state |
| `pages/ProgressPage.ts` | Extended with locators for: progress bar, inserted/skipped counters, success banner, error banner, "Start a new import" and "View import history" buttons |

---

## Key Design Decisions

### Status-only SSE events (creator decision, BR-02 acknowledged)
The import pipeline retains its single-COPY bulk approach. Only status transitions are emitted as SSE events: `processing` (job started), then `completed` or `failed`. The progress bar is indeterminate (animated shimmer) while processing and fills to 100% on completion. BR-05 (percentage = rows / totalRows) applies at the terminal state only — intermediate percentage is not available.

### In-memory event history for reconnection (Alternative Flow C)
`ProgressService` stores all events for a job in a `CopyOnWriteArrayList` keyed by `jobId`. On reconnection with `Last-Event-ID`, only events with `eventId > lastEventId` are replayed before joining the live sink. Since there are at most 2–3 events per job, memory impact is negligible.

### Late-connect fallback to DB
When a client connects for a job whose in-memory stream does not exist (server restart after job completion, or the import finished before the EventSource was opened), the controller queries `ImportJobRepository` and reconstructs a terminal `ProgressEvent` as `Flux.just(...)` that completes immediately. This guarantees the operator always sees the final outcome.

### `EventSource` cleanup vs. import continuity (BR-04)
The frontend `useEffect` cleanup calls `eventSource.close()`, which cancels only the HTTP/SSE connection. The background import coroutine runs in `applicationScope` (supervised, independent of any HTTP request or SSE subscription) and is unaffected by browser disconnection.

### Sink lifecycle and completion
`ProgressService` calls `sink.tryEmitComplete()` immediately after emitting the terminal event (completed or failed). Any subsequent `asFlux()` subscribers receive history replay then an immediate completion signal. Sinks are never explicitly removed — given the scope of this app, the memory cost of keeping 2–3 events per job indefinitely is acceptable.

---

## SSE Flow

```
Browser                                  Backend (WebFlux)
  |                                           |
  | GET /api/v1/import/jobs/{id}/events       |
  |──────────────────────────────────────►    |
  |                        subscribe to sink  |
  |                        + replay history   |
  |                                           |  coroutine: emit("processing")
  |  ◄── id:1                                 |
  |  ◄── data: {status:"processing", ...}     |
  |                                           |
  |  [indeterminate progress bar animates]    |
  |                                           |  COPY pipeline runs...
  |                                           |  coroutine: emit("completed")
  |  ◄── id:2                                 |
  |  ◄── data: {status:"completed", ...}      |
  |                                           |  sink.tryEmitComplete()
  |  [green banner, 100% bar, row counts]     |
  |  close EventSource                        |
  |                                           |
  | (reconnect with Last-Event-ID: 1)         |
  |──────────────────────────────────────►    |
  |  ◄── id:2                                 |  replayed from history (eventId > 1)
  |  ◄── data: {status:"completed", ...}      |
  |  [stream completes, banner shown]         |
```

---

## Business Rules Enforced

| Rule | Where enforced |
|------|----------------|
| BR-01: Server push, no polling | `EventSource` in `ProgressPanel.tsx`; `Flux<ServerSentEvent>` endpoint in `ImportController.kt` |
| BR-02: Updates feel live | Indeterminate animated progress bar during `processing`; status badge updates on each event |
| BR-03: Backend closes stream after terminal event | `ProgressService.emit()` calls `sink.tryEmitComplete()` after status = completed or failed |
| BR-04: Disconnect does not cancel import | Coroutine runs in `applicationScope` (Spring bean scope); `EventSource.close()` only cancels the SSE subscription |
| BR-05: Percentage shown | Terminal state: progress bar fills to 100%; no intermediate percentage (status-only events) |

---

## E2E Test Coverage

| Test | Scenario |
|------|----------|
| Full flow: progress page transitions to Completed | Main success scenario |
| Success banner shows inserted + skipped row counts | Postcondition / final summary |
| Progress bar reaches 100% on completion | BR-05 |
| Failed flow: error banner shows failure reason | Alternative flow A |
| Navigate away mid-import — job continues on server | BR-04 (verified via history/status check) |
| Direct navigation without jobId — error alert shown | Edge case (carried over from UC-03) |
