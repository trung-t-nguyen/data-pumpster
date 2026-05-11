---
name: plan-uc
description: Plan the use case specified by the argument (e.g. `uc-01`). Produces an approved implementation plan and, if backend endpoints are needed, an approved OpenAPI spec — but writes no production code.
argument-hint: "[uc-XX]"
disable-model-invocation: true
---

Plan the use case specified by the argument (e.g. `uc-01`). Produces an approved implementation plan and, if backend endpoints are needed, an approved OpenAPI spec — but writes no production code.

Steps:
1. Read `docs/use-cases/$ARGUMENTS.md` to understand the full scope, acceptance criteria, and business rules.
2. Read `docs/entity-model/` and `docs/architecture/ARCHITECTURE.md` for context.
3. Read `CLAUDE.md` for project conventions and build commands.
4. **Interview the creator** — before writing any code, ask targeted questions about architecture and technical decisions. Cover areas such as:
   - Preferred libraries or packages (e.g. HTTP client, form handling, validation)
   - State management approach (local state, context, server state)
   - API contract: request/response shape, error handling strategy
   - UI/UX details not specified in the use case doc (layout, loading states, empty states)
   - Backend concerns: transaction boundaries, error codes, idempotency
   - Any constraints or non-goals the creator wants to enforce
   Ask all questions in one batch and wait for answers before proceeding.
5. **Create an implementation plan** — based on the use case doc, architecture context, and the creator's answers, write a plan to `docs/implementation-plan/$ARGUMENTS-implementation-plan.md`. Use `docs/templates/implementation-plan-template.md` as the template:
   - Status + link to use case
   - Overview (what the UC delivers and how the work splits)
   - Files Changed (tables per area: frontend, backend, E2E)
   - Key Design Decisions (non-obvious choices with rationale)
   - Business Rules Enforced (rule → where enforced table)
   - E2E Test Coverage (test case → scenario table)
   After writing the plan, add a link to it in `docs/use-cases/$ARGUMENTS.md` — e.g. a `## Implementation Plan` section or an inline reference: `[Implementation Plan](../implementation-plan/$ARGUMENTS-implementation-plan.md)`.
   **Show the plan to the creator and wait for explicit approval before proceeding.**
6. After the plan is approved, review `docs/architecture/ARCHITECTURE.md` and update it to reflect any new decisions introduced by this UC's plan:
   - Add rows to the **Architecture Decisions** table for any non-obvious technical choices made in the plan (library picks, concurrency strategy, error-handling approach, etc.).
   - Add entries to **Dependency Changes** for any new packages the plan introduces (frontend or backend).
   - Update the **Verification Checklist** if the UC adds new acceptance criteria worth checking at the system level (e.g. a new table, a new API endpoint, a new UI flow).
   - Do not remove or change existing entries unless the plan explicitly supersedes them.
   - If no changes are needed, leave the file untouched.
7. If the use case requires backend API endpoints:
   - Add the new endpoints to the single service spec at `docs/architecture/contracts/api/data-pumpster-service.yaml` (OpenAPI 3.1). Create the file if it does not yet exist.
   - Define all paths, HTTP methods, request bodies, query params, and response schemas for this UC.
   - Include error responses (4xx/5xx) with problem-detail shapes.
   - Do not remove or modify existing paths from previous UCs.
   - **Show the updated spec to the creator and wait for approval before stopping.**
8. Stop. Run `/exec-plan $ARGUMENTS` to implement the approved plan.
