# Entity — `products`

Stores the product catalogue rows loaded by each import job. Rows are bulk-inserted using PostgreSQL's COPY protocol (UC-03). Every row is linked to the `import_jobs` record that created it for traceability.

---

## Columns

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `bigserial` | No | Primary key. System-generated; never mapped from CSV. |
| `sku` | `varchar` | No | Stock-keeping unit. Must be unique across the table. |
| `name` | `varchar` | No | Display name of the product. |
| `description` | `text` | Yes | Long-form product description. |
| `price` | `numeric(12,2)` | No | Unit price. |
| `currency` | `varchar(3)` | Yes | ISO 4217 currency code (e.g. `USD`). Defaults to tenant setting when omitted. |
| `category_id` | `bigint` | Yes | Foreign key to the product category table (out of scope for initial import). |
| `brand` | `varchar` | Yes | Brand or manufacturer name. |
| `weight_kg` | `numeric(8,3)` | Yes | Product weight in kilograms. |
| `is_active` | `boolean` | Yes | Whether the product is visible / available. Defaults to `true`. |
| `job_id` | `uuid` | No | References `import_jobs.id`. Injected automatically by the backend; never exposed in the mapping UI. |
| `created_at` | `timestamptz` | No | Row creation timestamp. Set by DB default. |
| `updated_at` | `timestamptz` | No | Last update timestamp. Managed by DB trigger or ORM. |

---

## Constraints

| Constraint | Columns | Rule |
|---|---|---|
| `products_pkey` | `id` | Primary key |
| `products_sku_key` | `sku` | Unique — duplicate SKUs are skipped (not an import error) |
| `products_job_id_fkey` | `job_id` | Foreign key → `import_jobs.id` |

---

## Writable vs System Columns

**Writable via COPY** (mapped from CSV or injected by backend):
`sku`, `name`, `description`, `price`, `currency`, `category_id`, `brand`, `weight_kg`, `is_active`, `job_id`

**System-managed** (always excluded from COPY, use DB defaults):
`id`, `created_at`, `updated_at`

---

## Business Rules

- `sku`, `name`, and `price` are required mappings in the import UI (UC-02 BR-01).
- A row that violates the `sku` uniqueness constraint is counted as `skipped_rows` on the parent `import_jobs` record and does not abort the import (UC-03 BR-05).
- `job_id` is automatically set by the backend for every row in the batch; it is never part of the operator's column mapping (UC-02 BR-04).
- `id`, `created_at`, and `updated_at` are never shown to the operator (UC-02 BR-03).

---

## Relationships

- Many `products` rows → one `import_jobs` row via `job_id`.
