# UC-05 — Review Import History

**Status:** ✅ Complete
**Actor:** Data Operator / Team Lead
**Goal:** Quickly see which imports have run, how many records each one loaded, and whether any failed — to support auditing and troubleshooting.

---

## Business Context

After running multiple imports over time, operators and team leads need a single place to verify that data was loaded correctly, identify any failed jobs, and understand the volume of data each import contributed. This view also acts as a launchpad for starting new imports.

---

## Preconditions

- The user navigates to the home page (`/`).
- At least one import job exists (otherwise an empty state is shown).

---

## Main Success Scenario

1. The page loads and immediately fetches the latest import job records from the backend.
2. The system displays a table of all past imports, sorted most-recent first, showing for each:
   - Status (Pending / Processing / Completed / Failed)
   - Total rows in the file
   - Rows successfully inserted
   - Rows skipped
   - Date and time the import was started
   - Duration (time from start to completion)
3. The operator can immediately see at a glance whether recent imports succeeded and how large they were.
4. The operator clicks **"New Import"** to begin another import (back to UC-01).

---

## Alternative Flows

**A — No imports have been run yet**
- At step 2: the job list is empty.
- The system shows a friendly empty state: *"No imports yet. Start your first import to load product data."*
- A **"Start your first import"** call-to-action links to the import flow.

**B — A job is still in progress**
- The in-progress job appears in the table with status **Processing** and the current processed-row count.
- The operator can click into the job to watch the live progress (UC-04).

**C — A job failed**
- The failed job appears with status **Failed** and the error description visible on hover or in an expanded row.
- The operator can use this to diagnose and re-upload a corrected file.

---

## Postconditions

- The operator has an accurate, up-to-date view of all import activity.

---

## Business Rules

- BR-01: The history list always reflects the current state of jobs — the page must not cache stale data.
- BR-02: All jobs are shown, including failed and in-progress ones; nothing is hidden.
- BR-03: Jobs are ordered by start time, most recent first.
- BR-04: The history is read-only; operators cannot edit or delete job records from this screen.

---

## Implementation Plan

[Implementation Plan](../implementation-plan/uc-05-import-history-implementation-plan.md)
