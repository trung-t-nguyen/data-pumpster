---
name: create-uc
description: Create a new use case document for the UC number specified by the argument (e.g. `uc-06`). Interviews the creator to gather all required details and writes docs/use-cases/uc-XX-[slug].md from the template. Writes no production code.
argument-hint: "[uc-XX]"
disable-model-invocation: true
---

Create a new use case document for the UC number specified by the argument (e.g. `uc-06`). Interviews the creator and writes `docs/use-cases/uc-XX-[slug].md` from the template. Writes no production code.

Steps:
1. Read `docs/templates/uc-template.md` to load the canonical structure.
2. Read `docs/REQUIREMENTS.md` to understand the existing UC list and pick the correct number if the argument is unclear.
3. Read `docs/entity-model/` and `docs/architecture/ARCHITECTURE.md` for context on the domain.
4. **Interview the creator** — ask all questions in one batch and wait for answers before writing anything:
   - **Title**: What is the short title for this use case? (e.g. "Export Products as CSV")
   - **Slug**: What slug should be used for the filename? (e.g. `export-csv` → `uc-06-export-csv.md`)
   - **Actor**: Who performs this use case? (e.g. "Operator", "System")
   - **Goal**: In one sentence, what does the actor achieve by the end of this UC?
   - **Business Context**: Why does this UC exist? What problem does it solve? (1–2 paragraphs)
   - **Preconditions**: What must be true before this UC begins? (e.g. prior UCs completed, data available)
   - **Main Success Scenario**: Walk through the numbered steps — actor actions and system responses.
   - **Alternative Flows**: Are there any deviations from the happy path? (empty state, errors, partial input)
   - **Postconditions**: What is guaranteed to be true after the main success scenario completes?
   - **Business Rules**: List all rules that are always enforced (constraints, validations, invariants). Label them BR-01, BR-02, etc.
5. **Write the use case doc** — using the creator's answers, fill in `docs/templates/uc-template.md` and save it to `docs/use-cases/$ARGUMENTS-[slug].md`:
   - Populate every section: Business Context, Preconditions, Main Success Scenario, Alternative Flows, Postconditions, Business Rules.
   - Set `**Status:** ⬜ Not started` and `**Version:** v1.0.0`.
   - Set the Implementation Plan link to the expected future path: `../implementation-plan/$ARGUMENTS-[slug]-implementation-plan.md`.
   - Do not invent content — if the creator left something blank, use a clear placeholder like `[TBD]`.
6. **Show the doc to the creator** and wait for explicit approval. Iterate on any requested changes and bump the patch version (e.g. v1.0.0 → v1.0.1) for each revision.
7. After approval, add the new UC to `docs/REQUIREMENTS.md`:
   - Add a row to the Use-Case Tracker table with status `⬜ Not started`.
   - Do not modify any existing rows.
8. Stop. Run `/plan-uc $ARGUMENTS` when ready to plan the implementation.
