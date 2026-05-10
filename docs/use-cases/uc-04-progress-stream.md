# UC-04 — Monitor Import Progress in Real Time

**Status:** ✅ Complete — [PR #5](https://github.com/trung-t-nguyen/data-pumpster/pull/5)
**Actor:** Data Operator
**Goal:** Stay informed about how the import is progressing without having to refresh the page or guess when it will finish.

---

## Business Context

Importing a large product catalogue can take minutes. Operators need confidence that the job is running, a sense of how far along it is, and immediate visibility when it completes or encounters a problem. Polling-based solutions add unnecessary delay; a live stream gives the operator accurate, up-to-the-moment feedback.

---

## Preconditions

- UC-03 has completed: the backend returned a Job ID and the job is in **Processing** state.
- The browser is connected to the internet and the backend is reachable.

---

## Main Success Scenario

1. The UI opens a live connection to the backend using the Job ID received in UC-03.
2. The backend begins sending progress updates as the import processes rows.
3. The UI displays:
   - A progress bar that fills as rows are processed.
   - A live counter showing rows inserted and rows skipped so far.
   - A status indicator: *Processing…*
4. Updates arrive continuously until the import finishes.
5. The backend sends a final **Completed** event.
6. The UI closes the live connection, shows a green success banner, and displays the final summary:
   - Total rows processed.
   - Rows successfully inserted.
   - Rows skipped (e.g. duplicate SKUs).

---

## Alternative Flows

**A — Import fails mid-way**
- At step 4: the backend encounters a fatal error and sends a **Failed** event.
- The UI closes the connection and shows a red error banner with the failure reason.
- The operator can return to the home page to see the failed job in history (UC-05).

**B — Browser disconnects before import finishes**
- The import job continues running on the server.
- If the operator returns and navigates to the job, they can see the final status in history (UC-05).
- The backend does not abort the import because the browser disconnected.

**C — No progress update for an extended period**
- If the connection drops silently, the browser's SSE client will attempt to reconnect automatically using the last received event ID.

---

## Postconditions

- The live connection is closed (either by the server on completion or by the browser on unmount).
- The operator knows the final outcome: how many rows were inserted and how many were skipped.

---

## Business Rules

- BR-01: Progress updates must be pushed by the server — the browser must not poll.
- BR-02: Updates must be frequent enough to feel live (at minimum every 500 rows or every few seconds, whichever comes first).
- BR-03: The backend must close the stream after sending the final event; it must not leave connections open indefinitely.
- BR-04: Navigating away from the progress screen must not cancel or interfere with the running import job.
- BR-05: The percentage shown is calculated as `rows processed ÷ estimated total rows × 100`, using the row count provided by the browser in UC-03.
