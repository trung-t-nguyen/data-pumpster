Execute the approved implementation plan for the use case specified by the argument (e.g. `uc-01`). Assumes `/plan-uc $ARGUMENTS` has already been run and the plan + API spec are approved.

Steps:
1. Read `docs/implementation-plan/$ARGUMENTS-implementation-plan.md` to load the approved plan.
2. Read `docs/architecture/contracts/api/data-pumpster-service.yaml` for the approved API spec (if it exists).
3. Implement the backend strictly according to the approved spec — do not deviate.
   - Every backend class (service, repository, controller, mapper, validator) must have a corresponding unit test in `data-pumpster-service/src/test/kotlin/`.
   - Use JUnit 5 + Mockito (or MockK) to test each class in isolation; mock all collaborators.
   - Test the happy path and all documented error/edge cases from the spec.
4. Implement the frontend against the same spec (treat it as the source of truth).
   - Implement only what is required by this use case — no more, no less.
   - **UI implementation must follow the prototype at `prototype/Data-Pumpster-Standalone.html`** — match layout, component structure, copy, and interaction patterns as closely as possible. Only deviate where the use case doc or creator's answers explicitly override the prototype.
5. Write E2E tests in `e2e/tests/$ARGUMENTS.spec.ts` covering the golden path and key edge cases:
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
6. Verify:
   - All acceptance criteria in the use case doc are met.
   - `npm run lint` passes (frontend — run from `data-pumpster-app/`).
   - `./gradlew test` passes (backend — run from `data-pumpster-service/`).
   - `make e2e` passes (run from repo root — starts services, runs full suite, tears down).
7. Create a PR with:
   - Title: `[UC-XX] <use case title>`
   - Body summarising what was implemented, the key technical decisions made, and how the acceptance criteria are satisfied.
   - Do not commit or attach test results, screenshots, or HTML reports — confirm in the PR body that all tests passed.
8. Mark the use case and implementation plan as complete, then update the tracker:
   a. In `docs/use-cases/$ARGUMENTS.md`, update the status field to `✅ Complete`.
   b. In `docs/implementation-plan/$ARGUMENTS-implementation-plan.md`, update the status field to `✅ Complete`.
   c. Update `docs/REQUIREMENTS.md` Use-Case Tracker: change the UC row status to `✅ Complete — [PR #N](url)` using the URL returned by `gh pr create`.
   - Commit all three files in one commit directly to the PR branch: `git add docs/use-cases/$ARGUMENTS.md docs/implementation-plan/$ARGUMENTS-implementation-plan.md docs/REQUIREMENTS.md && git commit -m "docs: mark UC-XX complete with PR #N link"`.
   - Push the commit so it is included in the PR.
9. Stop. Do not begin the next use case.
