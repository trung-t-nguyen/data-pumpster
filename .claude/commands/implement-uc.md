Implement the use case specified by the argument (e.g. `uc-01`).

Steps:
1. Read `docs/use-cases/$ARGUMENTS.md` to understand the full scope, acceptance criteria, and business rules.
2. Read `docs/entity-model/` and `docs/architecture/ARCHITECTURE.md` for context.
3. Read `CLAUDE.md` for project conventions and build commands.
4. Implement only what is required by this use case — no more, no less.
5. Verify:
   - All acceptance criteria in the use case doc are met.
   - `npm run lint` passes (frontend changes).
   - `./gradlew test` passes (backend changes).
6. Create a PR with:
   - Title: `[UC-XX] <use case title>`
   - Body summarising what was implemented and how the acceptance criteria are satisfied.
7. Stop. Do not begin the next use case.
