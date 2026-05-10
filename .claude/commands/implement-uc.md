Implement the use case specified by the argument (e.g. `uc-01`).

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
5. If the use case requires backend API endpoints:
   a. Write the OpenAPI spec first in `docs/architecture/contracts/api/$ARGUMENTS.yaml` (OpenAPI 3.1).
      - Define all paths, HTTP methods, request bodies, query params, and response schemas for this UC.
      - Include error responses (4xx/5xx) with problem-detail shapes.
      - **Show the spec to the creator and wait for approval before writing any backend code.**
   b. Implement the backend strictly according to the approved spec — do not deviate.
   c. Implement the frontend against the same spec (treat it as the source of truth).
6. Implement only what is required by this use case — no more, no less — respecting the creator's answers from step 4.
7. Write E2E tests in `e2e/tests/$ARGUMENTS.spec.ts` covering the golden path and key edge cases:
   - Follow the conventions in `e2e/tests/base.ts` and existing specs for structure and imports.
   - Add page-object helpers in `e2e/pages/` if the UC introduces new UI surfaces.
   - Place any required test fixture files (CSV, etc.) in `e2e/fixtures/`.
   - Each acceptance criterion must map to at least one test case.
   - Run the **full** suite from the `e2e/` directory: `npm test` (no file filter — all specs, not just the new one).
     `npm test` uses `--reporter=html,list`: it prints a list summary to stdout and generates the HTML report in `e2e/playwright-report/`.
   - Screenshots are saved automatically to `e2e/test-results/` (`screenshot: 'on'` is set in `playwright.config.ts`).
   - Every existing test must still pass. Any regression must be fixed before proceeding.
8. Verify:
   - All acceptance criteria in the use case doc are met.
   - `npm run lint` passes (frontend — run from `data-pumpster-app/`).
   - `./gradlew test` passes (backend — run from `data-pumpster-server/`).
   - `npm test` passes (E2E — run from `e2e/`).
9. Create a PR with:
   - Title: `[UC-XX] <use case title>`
   - Body summarising what was implemented, the key technical decisions made, and how the acceptance criteria are satisfied.
   - Paste the full `list` reporter output from `npm test` (pass/fail counts and test names).
   - Embed one screenshot per key acceptance criterion from `e2e/test-results/` using `![description](relative/path)`.
9. Stop. Do not begin the next use case.
