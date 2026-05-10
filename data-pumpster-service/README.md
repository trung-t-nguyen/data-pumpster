# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run dev server (auto-starts PostgreSQL via Docker Compose)
./gradlew bootRun

# Build
./gradlew build

# Run all tests
./gradlew test

# Run a single test class
./gradlew test --tests "com.ttng.pumpster.SomeTest"

# Run a single test method
./gradlew test --tests "com.ttng.pumpster.SomeTest.methodName"
```

## Architecture

**Package root:** `com.ttng.pumpster`

The server is a Spring Boot WebFlux application. The reactive/async model is a hybrid: WebFlux handles HTTP reactively, but JPA/Hibernate is synchronous — bridged via Kotlin Coroutines using `withContext(Dispatchers.IO)`.

```
web/          → WebFlux @RestController (reactive Mono/Flux return types)
service/      → Business logic; coroutine-based async processing
repository/   → Spring Data JPA (JpaRepository, synchronous)
domain/       → JPA @Entity classes
config/       → AppConfig (CoroutineScope bean), WebConfig (CORS)
```

### Import Job Flow

1. `POST /api/v1/import/jobs` receives a multipart request with `file` (CSV bytes), `mapping` (JSON), and optional `totalRows`.
2. `ImportController` validates parts and delegates to `ImportJobService`.
3. Service creates an `ImportJob` record (status: PENDING), immediately returns the `jobId` (202 ACCEPTED), then launches a background coroutine to process the CSV.
4. CSV processing:
   - Parses CSV with Apache Commons CSV
   - Creates a temporary PostgreSQL staging table
   - Bulk-loads rows via `COPY` command (high-performance)
   - Inserts into `products` via `INSERT … SELECT … ON CONFLICT DO NOTHING` (duplicates keyed on `sku` are silently skipped)
   - Updates `ImportJob` with `insertedRows`, `skippedRows`, and final status (COMPLETED / FAILED)

### Key Technical Decisions

- **PostgreSQL COPY for bulk insert**: raw JDBC `CopyManager` is used for throughput; this bypasses JPA.
- **Staging table**: a temp table absorbs the raw CSV before mapping to the products schema, isolating transformation errors.
- **`applicationScope` bean** (`AppConfig`): a supervisor-job-backed `CoroutineScope` used to launch fire-and-forget import coroutines so they outlive the HTTP request.
- **`ON CONFLICT DO NOTHING`**: SKU is the deduplication key; skipped rows are counted but not surfaced as errors.
- **`spring.jpa.hibernate.ddl-auto=update`**: schema migrations are handled automatically in dev; no Flyway/Liquibase.

### Domain Entities

| Entity | Table | Key Fields |
|---|---|---|
| `ImportJob` | `import_jobs` | `id` (UUID), `status`, `totalRows`, `insertedRows`, `skippedRows`, `errorDescription` |
| `Product` | `products` | `id`, `sku` (unique), `name`, `price` (12,2), `currency`, `categoryId`, `brand`, `weightKg` (8,3), `jobId` (FK) |

### API

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/import/jobs` | Submit a CSV import job |

CORS is configured for `http://localhost:3000` (frontend dev server). RFC 9457 Problem Detail responses are enabled for structured error bodies.

## Database

PostgreSQL 17 runs via `compose.yaml` (auto-managed by Spring Boot DevTools on `bootRun`).

```
host: localhost:5432
database: data_pumpster
username: data_pumpster
password: data_pumpster
```

## Testing Notes

- `DataPumpsterServerApplicationTests` is a context-load smoke test; it requires a running PostgreSQL instance or a test container.
- Integration tests that hit the DB should use `@SpringBootTest` + a test container or the `compose.yaml` stack.
- Unit tests for service logic should mock the `DataSource`/`JpaRepository` and avoid starting a full context (`@ExtendWith(MockitoExtension::class)`).