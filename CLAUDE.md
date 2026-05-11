# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**data-pumpster** is a full-stack monorepo consisting of two parts:

1. **data-pumpster-app**: A Next.js 16.2.6 frontend application (React 19.2.4) with TypeScript, Tailwind CSS v4, and ESLint
2. **data-pumpster-service**: A Spring Boot 4.0.6 Kotlin backend with reactive WebFlux, Spring Data JPA, and PostgreSQL

The project is licensed under MIT (Copyright 2026 Trung Nguyen).

## Repository Structure

```
/data-pumpster
├── docs/                       # Project documentation
│   ├── REQUIREMENTS.md        # Requirement catalog (CSV → PostgreSQL import pipeline)
│   ├── architecture/
│   │   └── ARCHITECTURE.md    # System architecture overview
│   ├── entity-model/
│   │   ├── README.md          # Entity model overview
│   │   ├── import-jobs.md     # ImportJob entity definition
│   │   └── products.md        # Product entity definition
│   ├── use-cases/
│   │   ├── uc-01-upload-csv.md
│   │   ├── uc-02-map-columns.md
│   │   ├── uc-03-submit-import.md
│   │   ├── uc-04-progress-stream.md
│   │   └── uc-05-import-history.md
│   ├── implementation-plan/
│   │   ├── uc-01-upload-csv-implementation-plan.md
│   │   ├── uc-02-map-columns-implementation-plan.md
│   │   └── uc-03-submit-import-implementation-plan.md
│   └── templates/
│       ├── uc-template.md                        # Template for new use-case docs
│       └── implementation-plan-template.md       # Template for new implementation plans
├── data-pumpster-app/          # Next.js frontend
│   ├── app/                    # Next.js App Router directory
│   │   ├── page.tsx           # Root page component
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── globals.css        # Tailwind CSS imports and theme
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── next.config.ts         # Next.js configuration
│   ├── eslint.config.mjs      # ESLint v9 flat config
│   └── postcss.config.mjs     # PostCSS with Tailwind plugin
├── data-pumpster-service/       # Spring Boot Kotlin backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/com/ttng/pumpster/
│   │   │   │   └── DataPumpsterServerApplication.kt
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/kotlin/      # JUnit5 tests
│   ├── build.gradle           # Gradle config with Spring Boot, Kotlin, Hibernates ORM
│   ├── gradle/                # Gradle wrapper
│   ├── compose.yaml           # Docker Compose for PostgreSQL (dev)
│   └── settings.gradle        # Gradle settings
└── LICENSE

```

## Technology Stack

### Frontend (data-pumpster-app)
- **Next.js** 16.2.6 (App Router)
- **React** 19.2.4
- **TypeScript** 5.x
- **Tailwind CSS** v4 (with @tailwindcss/postcss plugin)
- **ESLint** v9 (with Next.js core web vitals and TypeScript rules)

### Backend (data-pumpster-service)
- **Spring Boot** 4.0.6 (Spring Framework 7.0.7)
- **Kotlin** 2.2.21
- **Spring Data JPA** with Hibernate ORM 7.2.12
- **Spring Reactive Web** (WebFlux, Reactor)
- **PostgreSQL** driver
- **Kotlin Coroutines** integration
- **JUnit 5** for testing
- **Gradle** 8.x as build tool
- **Java** 24 (via toolchain)

## Build and Development Commands

### Frontend (data-pumpster-app)

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

**Note**: The app uses Next.js 16 which may have breaking changes from training data. Refer to `node_modules/next/dist/docs/` when writing new features.

### Backend (data-pumpster-service)

```bash
# Run development server with Docker Compose services
./gradlew bootRun

# Build the application
./gradlew build

# Run tests
./gradlew test

# Build Docker container (OCI image)
./gradlew bootBuildImage

# Compile to GraalVM native image (requires GraalVM 25+)
./gradlew nativeCompile

# Run tests in native image
./gradlew nativeTest
```

**Note**: The server uses `compose.yaml` for PostgreSQL (dev environment). When running `bootRun`, Spring Boot DevTools will automatically manage the Docker Compose services.

## Architecture Notes

### Frontend Architecture
- **App Router**: Uses Next.js App Router (directory-based routing in `/app`)
- **Styling**: Tailwind CSS v4 with PostCSS plugin; CSS variables for theming (light/dark modes)
- **Path Alias**: `@/*` maps to the root directory for imports
- **No external UI libraries**: Relies on Tailwind for styling

### Backend Architecture
- **Framework**: Spring Boot with reactive stack (WebFlux) for async request handling
- **Package**: `com.ttng.pumpster`
- **Database**: PostgreSQL with Spring Data JPA (synchronous ORM layer) + Kotlin Coroutines for reactive patterns
- **Build Info**: Version `0.0.1-SNAPSHOT`, targeting Java 24

### Integration Points
- Backend serves as REST/reactive API for the frontend
- Frontend communicates with backend via standard HTTP/WebFlux endpoints
- Both use TypeScript/Kotlin for type safety

## ESLint and Linting

- **ESLint Config**: Flat config format (ESLint v9) in `eslint.config.mjs`
- **Enabled Rules**: Next.js core web vitals + TypeScript type checking
- **Ignored Paths**: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run `npm run lint` in the app directory to check code

## Key Conventions

1. **Kotlin Package Names**: Use underscores instead of hyphens (e.g., `pumpster`)
2. **TypeScript/JSX**: All React components are `.tsx` files; use the `@/*` path alias
3. **CSS**: Inline Tailwind classes; avoid separate CSS files except for global styles
4. **Next.js Metadata**: Define using `Metadata` export in layout files
5. **Database**: Use `compose.yaml` to spin up PostgreSQL for development
6. **Doc versioning**: Every file under `docs/` carries a `**Version:** vX.Y.Z` field (semver). Bump the version whenever you update a doc: patch (0.0.x) for typos/clarifications, minor (0.x.0) for additions/restructuring, major (x.0.0) for scope or breaking changes.

## Development Workflow

1. **Frontend changes**: Edit files in `data-pumpster-app/app/`, run `npm run dev` for hot reload
2. **Backend changes**: Edit Kotlin files in `data-pumpster-service/src/main/kotlin/`, run `./gradlew bootRun`
3. **Database**: Start PostgreSQL via `./gradlew bootRun` (auto-managed by Spring Boot DevTools)
4. **Testing**: Run `npm run lint` for frontend; `./gradlew test` for backend

## Additional Resources

- **Frontend README**: `data-pumpster-app/README.md` (generic Next.js setup)
- **Backend Help**: `data-pumpster-service/HELP.md` (detailed build, native image, GraalVM info)
- **GitHub**: https://github.com/trung-t-nguyen/data-pumpster

## Project Documentation (`docs/`)

- **Requirements**: `docs/REQUIREMENTS.md` — full requirement catalog for the CSV → PostgreSQL import pipeline
- **Architecture**: `docs/architecture/ARCHITECTURE.md` — system architecture (Next.js + Spring Boot + PostgreSQL)
- **Entity Model**: `docs/entity-model/` — entity definitions for `ImportJob` and `Product`
- **Use Cases**: `docs/use-cases/` — five use cases covering upload, column mapping, import submission, progress streaming, and import history
- **Implementation Plans**: `docs/implementation-plan/` — one plan per completed UC; created during the plan-uc workflow
- **Templates**: `docs/templates/` — canonical templates for new use-case docs (`uc-template.md`) and implementation plans (`implementation-plan-template.md`)

## Development Workflow
- Implement one use case at a time, in UC order.
- Each UC must end with a PR before starting the next.
- Do not start a UC if the previous one has no merged PR.