# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **This is NOT the Next.js you know.** Version 16.2.6 has breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing new features; heed deprecation notices.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run lint       # ESLint check
```

There is no test runner configured in this app; use `npm run lint` for static validation.

## Architecture

### Routing

Three-step import wizard with App Router pages:

- `/` → redirects to `/import`
- `/import` → Step 1: upload CSV (`app/import/page.tsx`)
- `/import/map` → Step 2: map columns (`app/import/map/page.tsx`)
- `/import/progress` → Step 3: monitor job (`app/import/progress/page.tsx`)

`app/import/layout.tsx` wraps all three steps in `ImportContextProvider`.

### State

`app/import/ImportContext.tsx` holds the only shared state:

```typescript
type ParsedFile = { file: File; headers: string[]; rowCount: number };
type ColumnMapping = Record<string, string>; // dbColumn → csvHeader

{ parsed, setParsed, mapping, setMapping }
```

Access via `useImport()` hook. Steps navigate forward by pushing to the router; state lives in context, not URL (except `jobId` which is a query param on `/import/progress`).

### CSV Parsing

`app/import/csv.worker.ts` runs PapaParse in a Web Worker:
1. Phase 1 (`preview: 1`) — extract headers fast
2. Phase 2 (streaming) — count rows without blocking the main thread

The worker result is stored in context as `ParsedFile`.

### Backend Integration

Only one API call exists: `POST /api/v1/import/jobs` in `MappingPanel.tsx`.

```
FormData:
  file        — the CSV File object
  mapping     — JSON string of ColumnMapping
  totalRows   — number from context
Response: { jobId: string }
```

Base URL from `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`).

### Column Mapping Logic (`app/import/map/schema.ts`)

- `buildAutoMapping(headers)` — normalizes strings (lowercase, strips spaces/dashes/underscores) and pre-fills dropdowns
- `mappingSchema` (Zod) — enforces SKU, Name, Price are mapped before submit
- `findDuplicateMappings(mapping)` — warns when a single CSV column is mapped to multiple DB columns

### UI Components

- `components/ui/` — shadcn/ui primitives (Button via CVA, Select, Badge)
- `lib/utils.ts` — `cn()` (clsx + tailwind-merge)
- Icons: Lucide React
- Primitives: `@base-ui/react` for Button and Select

### Styling

Tailwind CSS v4 with CSS variables in `app/globals.css`. Colors use oklch color space. Dark mode via `--dark` custom variant. No separate CSS files per component — inline utility classes only.

## Key Conventions

- All `'use client'` components live in the route directory, not `components/`
- `components/` holds only generic, reusable UI primitives
- `NEXT_PUBLIC_API_URL` must be set in `.env.local` for backend calls
- System columns (`id`, `created_at`, `updated_at`, `job_id`) are never shown in the mapping UI
