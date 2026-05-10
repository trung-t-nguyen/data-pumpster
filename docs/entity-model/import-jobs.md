# Entity — `import_jobs`

Represents a single CSV import run. Created when the operator submits an import (UC-03), updated in real time during processing (UC-04), and displayed in the history view (UC-05).

---

## Columns

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key. Returned to the browser immediately on job creation and used to open the SSE stream. |
| `status` | `varchar` | No | Current job state. See [Status Values](#status-values). |
| `total_rows` | `int` | Yes | Estimated total data rows — supplied by the browser from the client-side CSV parse (UC-01). Null until the job is acknowledged. |
| `inserted_rows` | `int` | No | Running count of rows successfully written to `products`. Default `0`. |
| `skipped_rows` | `int` | No | Running count of rows rejected (e.g. duplicate `sku`). Default `0`. |
| `error_description` | `text` | Yes | Human-readable reason when `status = 'failed'`. Null otherwise. |
| `started_at` | `timestamptz` | No | Timestamp when the job record was created (server time). |
| `completed_at` | `timestamptz` | Yes | Timestamp when the job reached a terminal state (`completed` or `failed`). Null while in progress. |

---

## Status Values

| Value | Meaning |
|---|---|
| `pending` | Job accepted by the server; background processing has not started yet. |
| `processing` | Background COPY stream is actively writing rows. |
| `completed` | All rows processed; `inserted_rows` + `skipped_rows` = `total_rows`. |
| `failed` | A fatal error stopped processing; `error_description` is set. |

---

## Business Rules

- `id` is server-generated (UUID v4) and returned in the 202 response to the browser.
- `inserted_rows` and `skipped_rows` are incremented during processing and are visible live via SSE (UC-04).
- A job in a terminal state (`completed` or `failed`) is never transitioned back to `pending` or `processing`.
- Jobs are never deleted; history is always preserved (UC-05 BR-02).

---

## Relationships

- One `import_jobs` row → many `products` rows via `products.job_id`.
