# Entity Model

**Version:** v1.0.0

Two tables support the CSV import pipeline.

```mermaid
erDiagram
    import_jobs {
        uuid        id              PK
        varchar     status
        int         total_rows
        int         inserted_rows
        int         skipped_rows
        text        error_description
        timestamptz started_at
        timestamptz completed_at
    }

    products {
        bigserial   id              PK
        varchar     sku
        varchar     name
        text        description
        numeric     price
        varchar     currency
        bigint      category_id
        varchar     brand
        numeric     weight_kg
        boolean     is_active
        uuid        job_id          FK
        timestamptz created_at
        timestamptz updated_at
    }

    import_jobs ||--o{ products : "job_id"
```

## Entities

| Entity | File | Description |
|---|---|---|
| `import_jobs` | [import-jobs.md](import-jobs.md) | Tracks each CSV import run — status, progress counters, and error info |
| `products` | [products.md](products.md) | The product catalogue rows loaded by each import job |
