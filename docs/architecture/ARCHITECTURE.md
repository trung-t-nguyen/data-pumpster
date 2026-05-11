# Data Pumpster — Architecture

## Stack

**Next.js 16** (App Router) · **Spring Boot 4 / Kotlin / WebFlux** · **PostgreSQL 16**

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| File upload path | Browser → Spring Boot directly | Avoids Next.js proxy memory pressure for 1GB+ files |
| SSE mechanism | WebFlux `Flux<ServerSentEvent<T>>` + `Sinks.Many` | `SseEmitter` is Servlet-only; stack is WebFlux |
| Blocking JDBC | `Dispatchers.IO` coroutine scope | `CopyManager` is blocking; must not block WebFlux event loop |
| CSV parsing (BE) | Apache Commons CSV | Streaming-capable, no extra transitive deps |
| CSV parsing (FE) | PapaParse `preview:1` + Web Worker | Header extraction without freezing UI |
| UI components | shadcn/ui (Zinc palette) + Lucide icons | Matches spec |
| DB schema | JPA/Hibernate DDL generation (`ddl-auto=create-drop` in dev, `validate` in prod) | Entity classes are the single source of truth; no separate SQL script to keep in sync |
| History data fetch | `'use client'` component fetching on mount (not RSC async fetch) | Playwright `page.route()` only intercepts browser-initiated requests; server-side `fetch` inside RSCs runs in Node.js and cannot be mocked at the browser network level |

---

## Dependency Changes

### Backend (`data-pumpster-service/build.gradle`)
- Add `implementation 'org.apache.commons:commons-csv:1.12.0'`

### Frontend (`data-pumpster-app/`)
- Add `papaparse`, `zod`
- Add `@types/papaparse` (dev)
- Install shadcn/ui + components: `button card progress badge table select`

---

## Verification Checklist

- [x] `./gradlew bootRun` starts without errors and creates both DB tables
- [x] `psql` confirms `products` + `import_jobs` tables exist
- [x] `npm run dev` starts without errors
- [x] UC-01 through UC-05 pass their individual acceptance criteria
- [x] `./gradlew test` passes
- [x] `npm run lint` passes
