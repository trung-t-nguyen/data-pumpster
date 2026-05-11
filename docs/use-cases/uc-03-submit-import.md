# UC-03 — Submit an Import Job

**Version:** v1.0.0
**Status:** ✅ Complete — [PR #3](https://github.com/trung-t-nguyen/data-pumpster/pull/3)
**Implementation Plan:** [docs/plan/uc-03-submit-import.md](../plan/uc-03-submit-import.md)
**Actor:** Data Operator (initiates) · System (executes)
**Goal:** Persist the operator's product data from the CSV into the `products` table as fast and safely as possible.

---

## Business Context

Once the operator has confirmed the column mapping, the actual data transfer begins. Large product catalogues (tens of thousands to millions of rows) must be loaded reliably without timing out the browser or overwhelming the server's memory. The import runs as a background job so the operator can monitor it in real time (UC-04) rather than staring at a frozen screen.

---

## Preconditions

- UC-02 has completed: the operator has a confirmed column mapping.
- The CSV file is available in the browser (not yet sent to the server).
- The backend is reachable at the configured API URL.

---

## Main Success Scenario

1. The operator clicks **"Start Import"** on the mapping screen.
2. The system transmits the CSV file and the column mapping to the backend.
3. The backend acknowledges receipt immediately and returns a unique **Job ID** (the browser does not wait for the full import to finish).
4. The system records the import job as **Pending** in the job registry.
5. The system begins processing in the background:
   a. Reads the CSV row by row.
   b. Reorders each row's fields to match the database column order.
   c. Streams the transformed data directly into PostgreSQL using the high-speed COPY protocol.
   d. Attaches the **Job ID** to every inserted row for traceability.
6. The UI transitions to the progress screen (UC-04) so the operator can monitor the job.

---

## Alternative Flows

**A — Network error during file upload**
- At step 2: the request fails before the server receives it.
- The system shows: *"Upload failed. Please check your connection and try again."*
- No job record is created; the operator may retry from step 1.

**B — Backend rejects the payload**
- At step 3: the server returns a 4xx error (e.g. missing required mapping fields).
- The system shows the server's error message.
- The operator corrects the issue and retries from the mapping step.

**C — Import fails mid-stream**
- At step 5c: a database or IO error occurs during processing.
- The background job transitions to **Failed** and records the error reason.
- The operator is notified via the progress screen (UC-04) and may retry with a corrected file.

---

## Postconditions

**On success:**
- All valid CSV rows are inserted into the `products` table.
- Each inserted row carries the import's `job_id` for audit and rollback tracing.
- The job record shows status **Completed** with a final row count.

**On failure:**
- The job record shows status **Failed** with an error description.
- No partial data is left silently in the database without a corresponding failed-job record.

---

## Business Rules

- BR-01: The system must respond to the browser immediately (within the HTTP timeout) — processing happens asynchronously after the 202 response.
- BR-02: Every inserted product row must be traceable back to its import job via `job_id`.
- BR-03: The COPY protocol is used for bulk insert; row-by-row ORM writes are not acceptable for this operation.
- BR-04: Optional unmapped columns are stored as `NULL` in the database; they do not cause the import to fail.
- BR-05: Duplicate SKUs are a database-level constraint (`UNIQUE`). Rows that violate it are counted as skipped and do not abort the entire import.
