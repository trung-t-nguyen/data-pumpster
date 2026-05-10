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
5. **Create an implementation plan** — based on the use case doc, architecture context, and the creator's answers, write a plan to `docs/implementation-plan/$ARGUMENTS-implementation-plan.md`. Use `docs/templates/implementation-plan-template.md` as the template:
   - Status + link to use case
   - Overview (what the UC delivers and how the work splits)
   - Files Changed (tables per area: frontend, backend, E2E)
   - Key Design Decisions (non-obvious choices with rationale)
   - Business Rules Enforced (rule → where enforced table)
   - E2E Test Coverage (test case → scenario table)
   **Show the plan to the creator and wait for explicit approval before proceeding.**
6. If the use case requires backend API endpoints:
   a. Add the new endpoints to the single service spec at `docs/architecture/contracts/api/data-pumpster-server.yaml` (OpenAPI 3.1). Create the file if it does not yet exist.
      - Define all paths, HTTP methods, request bodies, query params, and response schemas for this UC.
      - Include error responses (4xx/5xx) with problem-detail shapes.
      - Do not remove or modify existing paths from previous UCs.
      - **Show the updated spec to the creator and wait for approval before writing any backend code.**
   b. Implement the backend strictly according to the approved spec — do not deviate.
      - Every backend class (service, repository, controller, mapper, validator) must have a corresponding unit test in `data-pumpster-server/src/test/kotlin/`.
      - Use JUnit 5 + Mockito (or MockK) to test each class in isolation; mock all collaborators.
      - Test the happy path and all documented error/edge cases from the spec.
   c. Implement the frontend against the same spec (treat it as the source of truth).
7. Implement only what is required by this use case — no more, no less — respecting the creator's answers from step 4.
   - **UI implementation must follow the prototype at `prototype/Data-Pumpster-Standalone.html`** — match layout, component structure, copy, and interaction patterns as closely as possible. Only deviate where the use case doc or creator's answers explicitly override the prototype.
8. Write E2E tests in `e2e/tests/$ARGUMENTS.spec.ts` covering the golden path and key edge cases:
   - Follow the conventions in `e2e/tests/base.ts` and existing specs for structure and imports.
   - Add page-object helpers in `e2e/pages/` if the UC introduces new UI surfaces.
   - Place any required test fixture files (CSV, etc.) in `e2e/fixtures/`.
   - Each acceptance criterion must map to at least one test case.
   - Run `make e2e` from the repo root. This single target:
       1. Starts everything via `make e2e-up`: database (`docker compose up -d`), backend (`./gradlew bootRun`, waits until ready on port 8080), and frontend (`npm run dev`, waits until ready on port 3000).
       2. Runs the full Playwright suite (`npm test` — all specs, no file filter; `--reporter=html,list` prints a summary and generates `e2e/playwright-report/`).
       3. Stops the frontend, backend, and tears down Docker volumes (`make e2e-down`) regardless of pass or fail.
   - Screenshots are saved automatically to `e2e/test-results/` (`screenshot: 'on'` is set in `playwright.config.ts`).
   - Every existing test must still pass. Any regression must be fixed before proceeding.
9. Verify:
   - All acceptance criteria in the use case doc are met.
   - `npm run lint` passes (frontend — run from `data-pumpster-app/`).
   - `./gradlew test` passes (backend — run from `data-pumpster-server/`).
   - `make e2e` passes (run from repo root — starts services, runs full suite, tears down).
10. Create a PR with:
    - Title: `[UC-XX] <use case title>`
    - Body summarising what was implemented, the key technical decisions made, and how the acceptance criteria are satisfied.
    - Do not commit or attach test results, screenshots, or HTML reports — confirm in the PR body that all tests passed.
11. Update `docs/REQUIREMENTS.md` Use-Case Tracker:
    - Change the UC row status to `✅ Complete — [PR #N](url)` using the URL returned by `gh pr create`.
    - Commit the update directly to the PR branch: `git add docs/REQUIREMENTS.md && git commit -m "docs: mark UC-XX complete with PR #N link"`.
    - Push the commit so it is included in the PR.
12. Stop. Do not begin the next use case.
