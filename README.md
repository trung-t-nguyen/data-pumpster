# data-pumpster

A full-stack CSV → PostgreSQL import pipeline built with Next.js and Spring Boot.

For project overview, architecture, build commands, and development conventions, see [CLAUDE.md](CLAUDE.md).

## Running Locally

Prerequisites: Docker, Java 21, Node.js.

| Command | Description |
|---|---|
| `make start` | Start all services (DB + backend + frontend) in separate Terminal windows |
| `make start-db` | Start PostgreSQL via Docker Compose only |
| `make start-backend` | Start Spring Boot backend on http://localhost:8080 |
| `make start-frontend` | Start Next.js frontend on http://localhost:3000 |
| `make stop` | Stop all services and tear down Docker volumes |

**Ports**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Database: localhost:5432

> `make start` opens new Terminal windows for the backend and frontend, so both run concurrently with live output. macOS only.

## Claude Code Skills

Skills live in [.claude/skills/](.claude/skills/).

| Skill | Description |
|---|---|
| `/create-uc [uc-XX]` | Create a new use case document — interviews the creator and writes `docs/use-cases/uc-XX-[slug].md` from the template (no production code) |
| `/update-uc [uc-XX]` | Update an existing use case document — interviews about what changed, applies edits, and bumps the version (no production code) |
| `/plan-uc [uc-XX]` | Plan a use case — produces an approved implementation plan and OpenAPI spec (no production code) |
| `/exec-plan [uc-XX]` | Execute the approved implementation plan for a use case |
| `/strike-uc [uc-XX]` | Run the full use case workflow: plan, get approval, then implement |