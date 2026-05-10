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
5. Implement only what is required by this use case — no more, no less — respecting the creator's answers from step 4.
6. Write E2E tests covering the golden path and key edge cases defined in the acceptance criteria:
   - Use the project's existing E2E framework (check `package.json` for Playwright/Cypress or equivalent).
   - Each acceptance criterion should map to at least one E2E test.
   - Tests must start from the user-facing entry point (page load / API call) and assert the full observable outcome.
   - Run the E2E suite and confirm all tests pass before proceeding.
7. Verify:
   - All acceptance criteria in the use case doc are met.
   - `npm run lint` passes (frontend changes).
   - `./gradlew test` passes (backend changes).
   - E2E tests pass (`npx playwright test` or equivalent).
8. Create a PR with:
   - Title: `[UC-XX] <use case title>`
   - Body summarising what was implemented, the key technical decisions made, and how the acceptance criteria are satisfied.
   - Attach the E2E test results: copy the summary output from the test run (pass/fail counts, test names) into the PR body.
   - Embed screenshots: for each key acceptance criterion, include a screenshot captured during the E2E run (found in `e2e/playwright-report/` or the configured output dir) using GitHub markdown `![description](path)` syntax or as file attachments via `gh pr create`.
8. Stop. Do not begin the next use case.
